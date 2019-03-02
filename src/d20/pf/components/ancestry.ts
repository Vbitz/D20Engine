import * as Core from 'core';
import {publicEnumField, publicField} from 'core/component';
import * as PF from 'd20/pf';
import * as Game from 'libgame';

export class AbilityScoreBonus extends Core.StatefulObject {
  @publicEnumField(PF.AbilityScore) type: PF.AbilityScore;

  constructor() {
    super();

    this.type = PF.AbilityScore.Any;
  }
}

export class AncestryState extends Core.StatefulObject {
  @publicField abilityScoreBonuses: AbilityScoreBonus[];
  @publicEnumField(PF.Size) size: PF.Size;
  @publicField speed: number;
  @publicField bonusFeats: number;
  @publicField languages: PF.Language[];

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