import * as Core from 'core';
import * as PF from 'd20/pf';
import * as Game from 'libgame';

export class PlayerState extends Core.StatefulObject {}

export class PlayerModule extends Core.Module {
  async onCreate(ctx: Core.Context) {}
}

export class Player extends Core.Component<PlayerState> {
  static State = PlayerState;
  static Module = PlayerModule;

  constructor() {
    super(new PlayerState());
  }

  async onCreate(ctx: Core.Context) {}
}