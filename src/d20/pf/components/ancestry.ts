import * as Core from 'core';
import * as PF from 'd20/pf';
import * as Game from 'libgame';

export class AbilityScoreBonus extends Core.StatefulObject {
  type: PF.AbilityScore;

  constructor() {
    super();

    this.type = PF.AbilityScore.Any;
  }
}

export class AncestryState extends Core.StatefulObject {
  abilityScoreBonuses: AbilityScoreBonus[];
  size: PF.Size;
  speed: number;
  bonusFeats: number;
  languages: PF.Language[];

  constructor() {
    super();

    this.abilityScoreBonuses = [];
    this.size = PF.Size.Medium;
    this.speed = 30;
    this.bonusFeats = 0;
    this.languages = [];
  }
}

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

Core.Reflect.embed(module);