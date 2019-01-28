import * as Core from 'core';
import * as Fifth from 'd20/fifth';

export const getChallenge: () => Fifth.Challenge =
    'd20.fifth.component.monster.getChallenge' as Core.EventDeclaration;

export interface MonsterParameters extends Core.ComponentParameters {
  challenge: Fifth.Challenge;
}

export class Monster extends Core.Component<MonsterParameters> {
  async onCreate(ctx: Core.Context): Promise<void> {
    throw new Error('Method not implemented.');
  }
}