import * as Core from 'core';

export const getInitiativeRoll: () => Core.DiceSpecification =
    'd20.fifth.component.creature.getInitiativeRoll' as Core.EventDeclaration;

export const doTurn: () => void =
    `d20.fifth.component.creature.doTurn` as Core.EventDeclaration;

export const doAttack: (args: {target: Core.Entity}) => void =
    `d20.fifth.component.creature.doAttack` as Core.EventDeclaration;

export interface CreatureParameters extends Core.ComponentParameters {}

export class Creature extends Core.Component<CreatureParameters> {
  async onCreate(ctx: Core.Context) {
    throw new Error('Method not implemented.');
  }
}