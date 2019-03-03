import * as Core from 'core';
import {existsSync, readFileSync} from 'fs';
import * as path from 'path';
import ts from 'typescript';

interface BaseObjectField {}

export interface BasicField extends BaseObjectField {
  type: 'string'|'number'|'boolean';
}

export interface StatefulObjectField extends BaseObjectField {
  type: 'object';

  sourceFilename: string;

  name: string;
}

export interface DiceSpecificationField extends BaseObjectField {
  type: 'diceSpecification';
}

export interface DiceResultField extends BaseObjectField {
  type: 'diceResult';
}

export interface EnumField extends BaseObjectField {
  type: 'enum';

  name: string;

  values: Core.Common.Bag<string>;
}

export interface ArrayField extends BaseObjectField {
  type: 'array';

  valueType: ObjectField;
}

export interface NullableField extends BaseObjectField {
  type: 'nullable';

  valueType: ObjectField;
}

export type ObjectField =
    BasicField|StatefulObjectField|DiceSpecificationField|DiceResultField|EnumField|ArrayField|NullableField;

/**
 * The StatefulObject's constructor is casted to this type to add the metadata
 * as a static field.
 */
interface StatefulObjectMetadata {
  __fields?: Core.Common.Bag<ObjectField>;
}

// This code is copied from base.ts

const CONFIG_FILENAME = 'd20Engine.config.json';

function getRootPath(dirname: string): string {
  // TODO(joshua): Handle if CONFIG_FILENAME does not exist up the tree.

  if (existsSync(path.join(dirname, CONFIG_FILENAME))) {
    return dirname;
  } else {
    return getRootPath(path.resolve(dirname, '..'));
  }
}

function getName(name: ts.PropertyName|undefined): string|undefined {
  // TODO(joshua): This is pretty fragile right now. If code uses more obscure
  // field naming techniques then this will break.
  if (name === undefined) {
    return undefined;
  } else if (ts.isIdentifier(name)) {
    return name.getText(name.getSourceFile());
  } else {
    throw new Error('Not Implemented');
  }
}

class ReflectionMetadata {
  private config: ts.CompilerOptions;

  private program: ts.Program;

  private typeChecker: ts.TypeChecker;

  constructor() {
    // I've added console logging to this to get a indication of how much time
    // this taking. The impact should be pretty minimal.
    console.log('Start Init ReflectionMetadata');

    const basePath = getRootPath(__dirname);

    // This code assumes a normal TypeScript project layout and no sub-projects.
    const tsConfigFilename = path.join(basePath, 'tsconfig.json');

    const config = ts.readConfigFile(
        tsConfigFilename, (path) => readFileSync(path, 'utf8'));

    // I'm not sure how this is supposed to be done but it works. I'd rather use
    // async filesystem methods but TypeScript normally uses the sync versions.
    const parseConfigHost: ts.ParseConfigHost = ts.sys;

    const parsedConfig =
        ts.parseJsonConfigFileContent(config.config, parseConfigHost, basePath);

    this.config = parsedConfig.options;

    // Create a program from the parsed configuration. This should match the
    // configuration used to build the engine in the first place.
    const program = ts.createProgram({
      rootNames: parsedConfig.fileNames,
      options: parsedConfig.options,
      projectReferences: parsedConfig.projectReferences
    });

    // Since this is the same configuration it's assumed any errors would
    // prevent this from running in the first place. That's why diagnostics are
    // not handled.

    this.program = program;

    this.typeChecker = program.getTypeChecker();

    console.log('Finish Init ReflectionMetadata');
  }

  /**
   * Embed metadata for all exported classes deriving from StatefulObjects as a
   * static field on the class. This is intended to be used for user-interface
   * and save/load systems.
   * This should appear as the last line in the file so all exports are
   * initialized.
   * @param fileModule The `module` global from the file. This is used to
   * determine the filename and list of exported symbols.
   */
  embed(fileModule: NodeModule) {
    const javascriptFilename = fileModule.filename;

    const sourceFile = this.getTypescriptSourceFile(javascriptFilename);

    if (sourceFile === undefined) {
      // This could happen if the file in the sub-module is wrong.
      throw new Error('Could not get file AST');
    }

    this.walkSourceTree(fileModule, sourceFile);
  }

  private walkSourceTree(fileModule: NodeModule, node: ts.Node) {
    // This method only looks for class declarations

    if (ts.isClassDeclaration(node)) {
      if (node.name === undefined) {
        return;
      }

      // This approach only works for exported classes since otherwise there's
      // no easy way to automatically enumerate class declarations. I also don't
      // assume there are any major use cases that would benefit from adding
      // metadata to non-exported classes.
      if (!this.isClassExported(node)) {
        return;
      }

      // Attempt to find the runtime version of this class declaration.

      const className = node.name.getText(node.getSourceFile());

      const runtimeClass = fileModule.exports[className];

      // Check using the prototype chain if the class inherits from
      // StatefulObject. In practice this will only work as expected if there
      // are no non-trivial classes in between this class and StatefulObject
      // since no metadata is added for other classes in the chain.

      if (!this.isStatefulObject(runtimeClass)) {
        return;
      }

      this.embedMetadata(fileModule.filename, node, runtimeClass);
    }

    ts.forEachChild(node, this.walkSourceTree.bind(this, fileModule));
  }

  private embedMetadata(
      filename: string, node: ts.ClassDeclaration,
      runtimeClass: Core.StatefulObject) {
    const fields: Core.Common.Bag<ObjectField> = {};

    // TODO(joshua): Handle inheritance. Right now this will only extract
    // members from the top level class declaration.
    for (const member of node.members) {
      const memberName = getName(member.name);

      // Only add metadata for properties. Methods are not exported or otherwise
      // exposed outside the declaration of a StatefulObject.
      if (!ts.isPropertyDeclaration(member) || memberName === undefined) {
        continue;
      }

      // Skip private members.
      if (this.isMemberPrivate(member)) {
        continue;
      }

      let memberType: ts.Type|undefined = undefined;

      // Get the type from either the explicit type or the inferred type in the
      // initializer.
      if (member.type === undefined) {
        if (member.initializer !== undefined) {
          const initializerType =
              this.typeChecker.getTypeAtLocation(member.initializer);

          memberType = initializerType;
        }
      } else {
        memberType = this.typeChecker.getTypeFromTypeNode(member.type);
      }

      if (memberType === undefined) {
        throw new Error('Could not determine type for member');
      }

      const fieldDescription =
          this.getMetadataField(filename, runtimeClass, memberName, memberType);

      fields[memberName] = fieldDescription;
    }

    // Set the metadata on the StatefulObject.
    this.setStatefulObjectMetadata(runtimeClass, fields);
  }

  private getMetadataField(
      filename: string, runtimeClass: Core.StatefulObject, memberName: string,
      memberType: ts.Type): ObjectField {
    if (memberType.flags & ts.TypeFlags.Enum
        || memberType.flags & ts.TypeFlags.EnumLiteral) {
      // Enum is handled first as depending on the initializers enums could be
      // other other types as well.

      return this.getEnumMetadataField(memberType);
    } else if (
        memberType.flags & ts.TypeFlags.String
        || memberType.flags & ts.TypeFlags.StringLiteral) {
      // Due to the way types are determined literals are grouped together. This
      // could be a limitation or source of bugs.

      return {type: 'string'};
    } else if (
        memberType.flags & ts.TypeFlags.Number
        || memberType.flags & ts.TypeFlags.NumberLiteral) {
      return {type: 'number'};
    } else if (
        memberType.flags & ts.TypeFlags.Boolean
        || memberType.flags & ts.TypeFlags.BooleanLiteral) {
      return {type: 'boolean'};
    } else if (memberType.flags & ts.TypeFlags.Object) {
      const objectType = memberType as ts.ObjectType;

      // Try to determine if the object is an array by looking at the reference.
      if (this.isArrayCompileTime(memberType)) {
        if (!(objectType.objectFlags & ts.ObjectFlags.Reference)) {
          throw new Error('Array is not a reference type');
        }

        const referenceType = objectType as ts.TypeReference;

        const typeArguments = referenceType.typeArguments;

        // Arrays should have a single type paramter containing the real type.

        if (typeArguments === undefined || typeArguments.length !== 1) {
          throw new Error('Arrays should always have 1 type argument');
        }

        const typeArgument = typeArguments[0];

        const valueType = this.getMetadataField(
            filename, runtimeClass, memberName + '#array', typeArgument);

        return {type: 'array', valueType};
      } else if (this.isStatefulObjectCompileTime(memberType)) {
        // StatefulObject has a more complicated implementation so it's split
        // into it's own method.

        return this.getObjectMetadataField(memberType);
      } else if (this.isDiceResultsCompileTime(memberType)) {
        // Both results and specification are complex primitives so need to be
        // explicitly detected but are otherwise treated like strings.

        return {type: 'diceResult'};
      } else if (this.isDiceSpecCompileTime(memberType)) {
        return {type: 'diceSpecification'};
      } else {
        throw new Error('Could not determine type (Maybe not serializable');
      }
    } else if (memberType.flags & ts.TypeFlags.UnionOrIntersection) {
      if (memberType.isUnion()) {
        // Only 1 case where a union could be used to implement nullable types
        // are implemented here.

        if (memberType.types.length !== 2) {
          throw new Error('Only unions with 2 types are supported (type|null)');
        }

        const [type, nullType] = memberType.types;

        if (!(nullType.getFlags() && ts.TypeFlags.Null
              || nullType.getFlags() && ts.TypeFlags.Undefined)) {
          throw new Error('Second type is not null/undefined.');
        }

        const valueType =
            this.getMetadataField(filename, runtimeClass, memberName, type);

        return {type: 'nullable', valueType};
      } else if (memberType.isIntersection()) {
        console.log(
            'embedMetadataToField', filename, memberName, 'intersection');

        throw new Error('Intersection Types Not Implemented');
      } else {
        // Here is will Entity/Component references will be implemented.

        throw new Error('Not Implemented');
      }
    } else {
      console.log(
          'embedMetadataToField', filename, memberName, 'unknown',
          memberType.flags);

      throw new Error('Could not determine type');
    }
  }

  /**
   * Get the declaration node using the symbol table. This will only work in
   * trivial cases and is a simplification of how the language service goto
   * declaration method works.
   */
  private getDeclarationFromSymbol(type: ts.Type): ts.Node {
    const symbol = type.getSymbol();

    if (symbol === undefined) {
      throw new Error('Could not get symbol for type');
    }

    const declarations = symbol.getDeclarations();

    if (declarations === undefined || declarations.length !== 1) {
      throw new Error('Could not get declaration from symbol');
    }

    return declarations[0];
  }

  private getEnumMetadataField(type: ts.Type): EnumField {
    let enumNode = this.getDeclarationFromSymbol(type);

    // If the enum only contains one member than the declaration node could be
    // this member rather the enum. Fortunately getting the parent is safe in
    // this case.
    if (ts.isEnumMember(enumNode)) {
      enumNode = enumNode.parent;
    }

    if (!ts.isEnumDeclaration(enumNode)) {
      throw new Error(
          `Node is no an enum node: node.kind=${ts.SyntaxKind[enumNode.kind]}`);
    }

    const values: Core.Common.Bag<string> = {};

    // Iterate though the members of the enum.
    for (const member of enumNode.members) {
      if (member.initializer === undefined
          || !ts.isStringLiteral(member.initializer)) {
        throw new Error(
            'StatefulObject enum members should be declared with a string initializer');
      }

      const description = getName(member.name);

      if (description === undefined) {
        throw new Error('Could not get enum member name');
      }

      const key = member.initializer.text;

      values[key] = description;
    }

    return {type: 'enum', name: getName(enumNode.name) || 'unknown', values};
  }

  /**
   * StatefulObject metadata is implemented as a reference rather than the
   * literal to avoid circular dependencies. The indentation is that
   * StatefulObjects are centrally registered so the details can be looked up at
   * runtime.
   */
  private getObjectMetadataField(type: ts.Type): StatefulObjectField {
    const objectNode = this.getDeclarationFromSymbol(type);

    if (!ts.isClassDeclaration(objectNode)) {
      throw new Error(`Node is no an class node: node.kind=${
          ts.SyntaxKind[objectNode.kind]}`);
    }

    return {
      type: 'object',
      name: getName(objectNode.name) || Core.Common.expect(),
      sourceFilename: objectNode.getSourceFile().fileName
    };
  }

  /**
   * Returns if the member contains a private modifier.
   */
  private isMemberPrivate(member: ts.PropertyDeclaration) {
    if (member.modifiers === undefined) {
      return false;
    }

    for (const modifier of member.modifiers) {
      if (modifier.kind === ts.SyntaxKind.PrivateKeyword) {
        return true;
      }
    }

    return false;
  }

  // Detection of tags rather then walking the prototype chain is used for
  // it's simplicity. For types controlled by D20Engine this is reliable and
  // will only trigger false positives in abusive situations.

  private isStatefulObjectCompileTime(type: ts.Type) {
    return this.hasPropertyCompileTime(type, '__statefulObjectTag');
  }

  private isDiceResultsCompileTime(type: ts.Type) {
    return this.hasPropertyCompileTime(type, '__diceResultsTag');
  }

  private isDiceSpecCompileTime(type: ts.Type) {
    return this.hasPropertyCompileTime(type, '__diceSpecificationTag');
  }

  /**
   * As the internal implementation of arrays are not under the control of
   * D20Engine detection is instead handled by looking for the declaration and
   * checking that it's in the standard library.
   */
  private isArrayCompileTime(type: ts.Type) {
    const symbol = type.getSymbol();

    if (symbol === undefined) {
      throw new Error('type.symbol === undefined');
    }

    if (symbol.name !== 'Array') {
      return false;
    }

    const declarations = symbol.getDeclarations();

    if (declarations === undefined) {
      return false;
    }

    for (const declaration of declarations) {
      const sourceFilename = declaration.getSourceFile().fileName;

      // Make sure this type is part of the standard library.

      if (sourceFilename.endsWith('lib.es2016.array.include.d.ts')
          || sourceFilename.endsWith('lib.es5.d.ts')) {
        return true;
      } else {
        console.log(sourceFilename);
      }
    }

    return false;
  }

  private hasPropertyCompileTime(type: ts.Type, name: string) {
    const symbols = type.getApparentProperties();

    for (const symbol of symbols) {
      if (symbol.getName() === name) {
        return true;
      }
    }

    return false;
  }

  /**
   * Look up the prototype chain to see if obj inherits from StatefulObject.
   */
  // tslint:disable-next-line: no-any
  private isStatefulObject(obj: any): boolean {
    const superConstructor = Object.getPrototypeOf(obj);

    if (superConstructor === Core.StatefulObject) {
      return true;
    } else if (superConstructor === null) {
      return false;
    } else {
      return this.isStatefulObject(superConstructor);
    }
  }

  /**
   * Check if a class is exported by looking for an export keyword.
   */
  private isClassExported(classDecl: ts.ClassDeclaration) {
    if (classDecl.modifiers === undefined) {
      return false;
    }

    for (const mod of classDecl.modifiers) {
      if (mod.kind === ts.SyntaxKind.ExportKeyword) {
        return true;
      }
    }

    return false;
  }

  private setStatefulObjectMetadata(
      obj: Core.StatefulObject, fields: Core.Common.Bag<ObjectField>) {
    const objMetadata = obj as StatefulObjectMetadata;

    if (objMetadata.__fields !== undefined) {
      throw new Error('Object already has metadata set.');
    }

    objMetadata.__fields = fields;
  }

  /**
   * Uses the configuration in tsconfig to attempt to resolve the location of
   * the original source file from the built javascript file.
   */
  private getTypescriptSourceFile(filename: string) {
    const relativeFilename = path.relative(this.config.outDir || '', filename);
    const typescriptFilename =
        relativeFilename.substring(
            0, relativeFilename.length - path.extname(relativeFilename).length)
        + '.ts';

    const typescriptSourceFile = this.program.getSourceFile(typescriptFilename);

    return typescriptSourceFile;
  }
}

const Reflect = new ReflectionMetadata();

export {Reflect};