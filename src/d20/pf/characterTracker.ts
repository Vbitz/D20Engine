import * as Core from 'core';

export class CharacterTrackerParameters extends Core.ComponentParameters {
  maxHitPoints: number;
  currentHitPoints: number;

  constructor() {
    super();

    this.maxHitPoints = 10;
    this.currentHitPoints = this.maxHitPoints;
  }
}

function toNumber(value: Core.Value): number {
  if (typeof (value) === 'string') {
    return Number.parseInt(value, 10);
  } else if (typeof (value) === 'number') {
    return value;
  } else {
    throw new Error('Not Implemented');
  }
}

export class CharacterTracker extends
    Core.Component<CharacterTrackerParameters> {
  constructor() {
    super(new CharacterTrackerParameters());
  }

  async onCreate(ctx: Core.Context) {
    this.addRPCMarshal('hp', async (ctx, rpcCtx, chain) => {
      await rpcCtx.reply(`Current HP: ${this.parameters.currentHitPoints}/${
          this.parameters.maxHitPoints}`);
    });

    this.addRPCMarshal('setMaxHp', async (ctx, rpcCtx, chain) => {
      const [newMaxHP, ...rest] = chain;

      let newMaxHPValue = toNumber(newMaxHP);

      this.parameters.maxHitPoints = newMaxHPValue;
    });

    this.addRPCMarshal('addHp', async (ctx, rpcCtx, chain) => {
      const [hpChange, ...rest] = chain;

      let hpChangeValue = toNumber(hpChange);

      this.parameters.currentHitPoints += hpChangeValue;
    });
  }
}