import * as Core from 'core';
import * as Fifth from 'd20/fifth';

export const getChallenge = new Core.Event<() => Fifth.Challenge>();

export class MonsterParameters extends Core.StatefulObject {
  challenge: Fifth.Challenge;

  constructor() {
    super();

    this.challenge = Fifth.Challenge.Zero;
  }
}

export class Monster extends Core.Component<MonsterParameters> {
  constructor() {
    super(new MonsterParameters());
  }

  async onCreate(ctx: Core.Context): Promise<void> {
    throw new Error('Method not implemented.');
  }
}