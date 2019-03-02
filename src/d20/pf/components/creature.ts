import * as Core from 'core';
import * as PF from 'd20/pf';
import * as Game from 'libgame';

export class CreatureState extends Core.StatefulObject {}

export class CreatureModule extends Core.Module {
  async onCreate(ctx: Core.Context) {}
}

export class Creature extends Core.Component<CreatureState> {
  static State = CreatureState;
  static Module = CreatureModule;

  constructor() {
    super(new CreatureState());
  }

  async onCreate(ctx: Core.Context) {}
}