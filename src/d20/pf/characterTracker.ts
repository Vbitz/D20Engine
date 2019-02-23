import * as Core from 'core';
import * as Game from 'libgame';

class CharacterTrackerParameters extends Core.ComponentParameters {
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
  static readonly Parameters = CharacterTrackerParameters;

  static currentHitPoints = Game.Property<number>();

  constructor() {
    super(new CharacterTrackerParameters());
  }

  async onCreate(ctx: Core.Context) {
    this.addRPCMarshal(
        'hp', ' : Get current hitpoints value.', async (ctx, rpcCtx, chain) => {
          await rpcCtx.reply(`Current HP: ${this.parameters.currentHitPoints}/${
              this.parameters.maxHitPoints}`);
        });

    this.addRPCMarshal(
        'setMaxHp', '<newValue> : Set a new maximum hitpoints value.',
        async (ctx, rpcCtx, chain) => {
          const [newMaxHP, ...rest] = chain;

          const newMaxHPValue = toNumber(newMaxHP);

          await this.setState(ctx, {maxHitPoints: newMaxHPValue});
        });

    this.addRPCMarshal(
        'addHp', '<change> : Add or subtract from current HP.',
        async (ctx, rpcCtx, chain) => {
          const [hpChange, ...rest] = chain;

          const hpChangeValue = toNumber(hpChange);

          await this.setState(ctx, {
            currentHitPoints: Math.min(
                this.parameters.currentHitPoints + hpChangeValue,
                this.parameters.maxHitPoints)
          });

          await rpcCtx.reply(`New HP: ${this.parameters.currentHitPoints}/${
              this.parameters.maxHitPoints}`);
        });

    Game.propertyImplementation(
        ctx, this, CharacterTracker.currentHitPoints, 'currentHitPoints');
  }
}