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

      this.embedMetadata(node, runtimeClass);
    }

    ts.forEachChild(node, this.walkSourceTree.bind(this, fileModule));
  }

  private embedMetadata(
      node: ts.ClassDeclaration, runtimeClass: Core.StatefulObject) {
    // Currently no-op.
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