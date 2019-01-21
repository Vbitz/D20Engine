import * as Core from 'core';

export const getInitiativeRoll: () => number =
    'd20.fifth.component.creature.getInitiativeRoll' as Core.EventDeclaration;

export interface CreatureParameters extends Core.ComponentParameters {}

export class Creature extends Core.Component<CreatureParameters> {
  async onCreate(ctx: Core.Context) {
    throw new Error('Method not implemented.');
  }
}