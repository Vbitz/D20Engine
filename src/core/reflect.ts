import * as Core from 'core';
import {existsSync, readFileSync} from 'fs';
import * as path from 'path';
import ts from 'typescript';

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

      this.embedMetadata(fileModule.filename, node, runtimeClass);
    }

    ts.forEachChild(node, this.walkSourceTree.bind(this, fileModule));
  }

  private embedMetadata(
      filename: string, node: ts.ClassDeclaration,
      runtimeClass: Core.StatefulObject) {
    for (const member of node.members) {
      const memberName = getName(member.name);

      if (!ts.isPropertyDeclaration(member) || memberName === undefined) {
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

      this.embedMetadataToField(filename, runtimeClass, memberName, memberType);
    }
  }

  // This method should really turn into a getType method.
  private embedMetadataToField(
      filename: string, runtimeClass: Core.StatefulObject, memberName: string,
      memberType: ts.Type) {
    if (memberType.flags & ts.TypeFlags.Enum
        || memberType.flags & ts.TypeFlags.EnumLiteral) {
      console.log('embedMetadataToField', filename, memberName, 'enum');
    } else if (
        memberType.flags & ts.TypeFlags.String
        || memberType.flags & ts.TypeFlags.StringLiteral) {
      // Add Type Metadata for String
      console.log('embedMetadataToField', filename, memberName, 'string');
    } else if (
        memberType.flags & ts.TypeFlags.Number
        || memberType.flags & ts.TypeFlags.NumberLiteral) {
      console.log('embedMetadataToField', filename, memberName, 'number');
    } else if (
        memberType.flags & ts.TypeFlags.Boolean
        || memberType.flags & ts.TypeFlags.BooleanLiteral) {
      console.log('embedMetadataToField', filename, memberName, 'boolean');
    } else if (memberType.flags & ts.TypeFlags.Object) {
      const objectType = memberType as ts.ObjectType;

      if (this.isStatefulObjectCompileTime(memberType)) {
        console.log(
            'embedMetadataToField', filename, memberName, 'statefulObject');
      } else if (this.isDiceResultsCompileTime(memberType)) {
        console.log(
            'embedMetadataToField', filename, memberName, 'diceResults');
      } else if (this.isDiceSpecCompileTime(memberType)) {
        console.log(
            'embedMetadataToField', filename, memberName, 'diceSpecification');
      } else if (this.isArrayCompileTime(memberType)) {
        console.log('embedMetadataToField', filename, memberName, 'array');

        if (!(objectType.objectFlags & ts.ObjectFlags.Reference)) {
          throw new Error('Not Implemented');
        }

        const referenceType = objectType as ts.TypeReference;

        const typeArguments = referenceType.typeArguments;

        if (typeArguments === undefined || typeArguments.length !== 1) {
          throw new Error('Not Implemented');
        }

        const typeArgument = typeArguments[0];

        this.embedMetadataToField(
            filename, runtimeClass, memberName + '#array', typeArgument);

        // Arrays should have a single type paramter containing the real type.
      } else {
        throw new Error('Could not determine type (Maybe not serializable');
      }
    } else if (memberType.flags & ts.TypeFlags.UnionOrIntersection) {
      if (memberType.isUnion()) {
        console.log('embedMetadataToField', filename, memberName, 'union');

        console.log(memberType.types.length);

        if (memberType.types.length !== 2) {
          throw new Error('Not Implemented');
        }

        const [type, nullType] = memberType.types;

        if (nullType.getFlags() && ts.TypeFlags.Null
            || nullType.getFlags() && ts.TypeFlags.Undefined) {
        }

        this.embedMetadataToField(
            filename, runtimeClass, memberName + '#nullUnion', type);
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