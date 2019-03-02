import * as Core from 'core';
import * as PF from 'd20/pf';
import * as Game from 'libgame';

export class AncestryState extends Core.StatefulObject {}

export class AncestryModule extends Core.Module {
  async onCreate(ctx: Core.Context) {}
}

export class Ancestry extends Core.Component<AncestryState> {
  static State = AncestryState;
  static Module = AncestryModule;

  constructor() {
    super(new AncestryState());
  }

  async onCreate(ctx: Core.Context) {}
}