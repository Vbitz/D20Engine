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
  if (name === undefined) {
    return undefined;
  } else if (ts.isIdentifier(name)) {
    return name.getText(name.getSourceFile());
  } else {
    throw new Error('Not Implemented');
  }
}

class ReflectionMetadata {
  private basePath: string;
  private config: ts.CompilerOptions;
  private program: ts.Program;
  private typeChecker: ts.TypeChecker;

  constructor() {
    console.log('Start Init ReflectionMetadata');

    const basePath = getRootPath(__dirname);

    this.basePath = basePath;

    const tsConfigFilename = path.join(basePath, 'tsconfig.json');

    const config = ts.readConfigFile(
        tsConfigFilename, (path) => readFileSync(path, 'utf8'));

    const parseConfigHost: ts.ParseConfigHost = ts.sys;

    const parsedConfig =
        ts.parseJsonConfigFileContent(config.config, parseConfigHost, basePath);

    this.config = parsedConfig.options;

    const program = ts.createProgram({
      rootNames: parsedConfig.fileNames,
      options: parsedConfig.options,
      projectReferences: parsedConfig.projectReferences
    });

    this.program = program;
    this.typeChecker = program.getTypeChecker();

    console.log('Finish Init ReflectionMetadata');
  }

  embed(fileModule: NodeModule) {
    const javascriptFilename = fileModule.filename;

    const sourceFile = this.getTypescriptSourceFile(javascriptFilename);

    if (sourceFile === undefined) {
      throw new Error('Could not get file AST');
    }

    this.walkSourceTree(fileModule, sourceFile);
  }

  private walkSourceTree(fileModule: NodeModule, node: ts.Node) {
    if (ts.isClassDeclaration(node)) {
      if (node.name === undefined) {
        return;
      }

      if (!this.isClassExported(node)) {
        return;
      }

      const className = node.name.getText(node.getSourceFile());

      const runtimeClass = fileModule.exports[className];

      if (!this.isStatefulObject(runtimeClass)) {
        return;
      }

      this.embedMetadata(fileModule.filename, className, node, runtimeClass);
    }

    ts.forEachChild(node, this.walkSourceTree.bind(this, fileModule));
  }

  private embedMetadata(
      filename: string, className: string, node: ts.ClassDeclaration,
      runtimeClass: Core.StatefulObject) {
    const fields: Core.Common.Bag<ObjectField> = {};

    for (const member of node.members) {
      const memberName = getName(member.name);

      if (!ts.isPropertyDeclaration(member) || memberName === undefined) {
        continue;
      }

      if (this.isMemberPrivate(member)) {
        continue;
      }

      let memberType: ts.Type|undefined = undefined;

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

    this.setStatefulObjectMetadata(runtimeClass, fields);
  }

  private getMetadataField(
      filename: string, runtimeClass: Core.StatefulObject, memberName: string,
      memberType: ts.Type): ObjectField {
    if (memberType.flags & ts.TypeFlags.Enum
        || memberType.flags & ts.TypeFlags.EnumLiteral) {
      return this.getEnumMetadataField(memberType);
    } else if (
        memberType.flags & ts.TypeFlags.String
        || memberType.flags & ts.TypeFlags.StringLiteral) {
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
        return this.getObjectMetadataField(memberType);
      } else if (this.isDiceResultsCompileTime(memberType)) {
        return {type: 'diceResult'};
      } else if (this.isDiceSpecCompileTime(memberType)) {
        return {type: 'diceSpecification'};
      } else {
        throw new Error('Could not determine type (Maybe not serializable');
      }
    } else if (memberType.flags & ts.TypeFlags.UnionOrIntersection) {
      if (memberType.isUnion()) {
        console.log('embedMetadataToField', filename, memberName, 'union');

        console.log(memberType.types.length);

        if (memberType.types.length !== 2) {
          throw new Error('Only unions with 2 types are supported (type|null)');
        }

        const [type, nullType] = memberType.types;

        if (nullType.getFlags() && ts.TypeFlags.Null
            || nullType.getFlags() && ts.TypeFlags.Undefined) {
        }

        const valueType =
            this.getMetadataField(filename, runtimeClass, memberName, type);

        return {type: 'nullable', valueType};
      } else if (memberType.isIntersection()) {
        console.log(
            'embedMetadataToField', filename, memberName, 'intersection');

        throw new Error('Intersection Types Not Implemented');
      } else {
        throw new Error('Not Implemented');
      }
    } else {
      console.log(
          'embedMetadataToField', filename, memberName, 'unknown',
          memberType.flags);

      throw new Error('Could not determine type');
    }
  }

  private getEnumMetadataField(type: ts.Type): EnumField {
    const symbol = type.getSymbol();

    if (symbol === undefined) {
      throw new Error('Could not get symbol for enum');
    }

    const declarations = symbol.getDeclarations();

    if (declarations === undefined || declarations.length !== 1) {
      throw new Error('Could not get declaration from symbol');
    }

    let enumNode = declarations[0];

    if (ts.isEnumMember(enumNode)) {
      enumNode = enumNode.parent;
    }

    if (!ts.isEnumDeclaration(enumNode)) {
      throw new Error(
          `Node is no an enum node: node.kind=${ts.SyntaxKind[enumNode.kind]}`);
    }

    const values: Core.Common.Bag<string> = {};

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

  private getObjectMetadataField(type: ts.Type): StatefulObjectField {
    const symbol = type.getSymbol();

    if (symbol === undefined) {
      throw new Error('Could not get symbol for object');
    }

    const declarations = symbol.getDeclarations();

    if (declarations === undefined || declarations.length !== 1) {
      throw new Error('Could not get declaration from symbol');
    }

    const objectNode = declarations[0];

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

  private isStatefulObjectCompileTime(type: ts.Type) {
    return this.hasPropertyCompileTime(type, '__statefulObjectTag');
  }

  private isDiceResultsCompileTime(type: ts.Type) {
    return this.hasPropertyCompileTime(type, '__diceResultsTag');
  }

  private isDiceSpecCompileTime(type: ts.Type) {
    return this.hasPropertyCompileTime(type, '__diceSpecificationTag');
  }

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