import * as Core from 'core';
import {publicField} from 'core/component';
import * as PF from 'd20/pf';
import * as Game from 'libgame';

export class ClassState extends Core.StatefulObject {
  hitDice: string;

  constructor() {
    super();

    this.hitDice = 'd10';
  }
}

export class ClassModule extends Core.Module {
  async onCreate(ctx: Core.Context) {}
}

export class Class extends Core.Component<ClassState> {
  static State = ClassState;
  static Module = ClassModule;

  constructor() {
    super(new ClassState());
  }

  async onCreate(ctx: Core.Context) {}
}

Core.Reflect.embed(module);