import * as Core from 'core';
import * as Fifth from 'd20/fifth';

export const getAttackRoll: () => Core.DiceSpecification =
    `d20.fifth.component.meleeAttackAction.getAttackRoll` as
    Core.EventDeclaration;

export const getDamageRoll: () => Core.DiceSpecification =
    `d20.fifth.component.meleeAttackAction.getDamageRoll` as
    Core.EventDeclaration;

export interface MeleeAttackActionParameters extends Core.ComponentParameters {
  name: string;
  hitBonus: number;
  reach: number;
  damageRoll: string;
  damageType: Fifth.DamageType;
}

export class MeleeAttackAction extends
    Core.Component<MeleeAttackActionParameters> {
  async onCreate(ctx: Core.Context) {
    throw new Error('Method not implemented.');
  }
}