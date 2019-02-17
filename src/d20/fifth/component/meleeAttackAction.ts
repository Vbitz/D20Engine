import * as Core from 'core';
import {publicEnumField, publicField} from 'core/component';
import * as Fifth from 'd20/fifth';

export const getAttackRoll: () => Core.DiceSpecification =
    `d20.fifth.component.meleeAttackAction.getAttackRoll` as
    Core.EventDeclaration;

export const getDamageRoll: () => Core.DiceSpecification =
    `d20.fifth.component.meleeAttackAction.getDamageRoll` as
    Core.EventDeclaration;

export class MeleeAttackActionParameters extends Core.ComponentParameters {
  @publicField name: string;
  @publicField hitBonus: number;
  @publicField reach: number;
  @publicField damageRoll: string;
  @publicEnumField(Fifth.DamageType) damageType: Fifth.DamageType;

  constructor() {
    super();

    this.name = '';
    this.hitBonus = 2;
    this.reach = 5;
    this.damageRoll = 'd4';
    this.damageType = Fifth.DamageType.Bludgeoning;
  }
}

export class MeleeAttackAction extends
    Core.Component<MeleeAttackActionParameters> {
  constructor() {
    super(new MeleeAttackActionParameters());
  }

  async onCreate(ctx: Core.Context) {
    throw new Error('Method not implemented.');
  }
}