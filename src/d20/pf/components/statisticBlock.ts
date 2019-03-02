import * as Core from 'core';
import {publicField} from 'core/component';
import * as Game from 'libgame';

export class StatisticsBlockState extends Core.StatefulObject {
  strength = Core.DiceGenerator.constantResult(10);
  dexterity = Core.DiceGenerator.constantResult(10);
  constitution = Core.DiceGenerator.constantResult(10);
  intelligence = Core.DiceGenerator.constantResult(10);
  wisdom = Core.DiceGenerator.constantResult(10);
  charisma = Core.DiceGenerator.constantResult(10);

  totalRolls = 0;
}

export class StatisticsBlockModule extends Core.Module {
  async onCreate(ctx: Core.Context) {}
}

export class StatisticsBlock extends Core.Component<StatisticsBlockState> {
  static State = StatisticsBlockState;
  static Module = StatisticsBlockModule;

  // Property declarations.
  static strength = Game.Property<Core.DiceResults|number>();
  static dexterity = Game.Property<Core.DiceResults|number>();
  static constitution = Game.Property<Core.DiceResults|number>();
  static intelligence = Game.Property<Core.DiceResults|number>();
  static wisdom = Game.Property<Core.DiceResults|number>();
  static charisma = Game.Property<Core.DiceResults|number>();

  // Event declarations.
  static strengthModifier = new Core.Event<() => (number | null)>();
  static dexterityModifier = new Core.Event<() => (number | null)>();
  static constitutionModifier = new Core.Event<() => (number | null)>();
  static intelligenceModifier = new Core.Event<() => (number | null)>();
  static wisdomModifier = new Core.Event<() => (number | null)>();
  static charismaModifier = new Core.Event<() => (number | null)>();

  // Method declarations
  static roll = new Core.Event<(roll?: Core.DiceSpecification) => void>();
  static reroll = new Core.Event<() => void>();

  constructor() {
    super(new StatisticsBlockState());
  }

  async onCreate(ctx: Core.Context) {
    async function getModifier(
        this: StatisticsBlock,
        event: Core.Event<() => Core.DiceResults | number>, ctx: Core.Context) {
      const value = await ctx.callEvent(ctx.entity, event).call();

      if (value !== undefined) {
        if (typeof (value) === 'number') {
          return this.getModifier(value);
        } else {
          return this.getModifier(value.value);
        }
      } else {
        return null;
      }
    }

    ctx.registerComponentHandler(
        this, StatisticsBlock.roll, this.roll.bind(this));
    ctx.registerComponentHandler(
        this, StatisticsBlock.reroll, this.reroll.bind(this));

    ctx.registerComponentHandler(
        this, StatisticsBlock.strengthModifier,
        getModifier.bind(this, StatisticsBlock.strength.get));
    ctx.registerComponentHandler(
        this, StatisticsBlock.dexterityModifier,
        getModifier.bind(this, StatisticsBlock.dexterity.get));
    ctx.registerComponentHandler(
        this, StatisticsBlock.constitutionModifier,
        getModifier.bind(this, StatisticsBlock.constitution.get));
    ctx.registerComponentHandler(
        this, StatisticsBlock.intelligenceModifier,
        getModifier.bind(this, StatisticsBlock.intelligence.get));
    ctx.registerComponentHandler(
        this, StatisticsBlock.wisdomModifier,
        getModifier.bind(this, StatisticsBlock.wisdom.get));
    ctx.registerComponentHandler(
        this, StatisticsBlock.charismaModifier,
        getModifier.bind(this, StatisticsBlock.charisma.get));

    // TODO(joshua): Where did number|DiceResults come from? This seems wierd
    // and may be a compiler bug.
    Game.propertyImplementation(
        ctx, this, StatisticsBlock.strength, 'strength');
    Game.propertyImplementation(
        ctx, this, StatisticsBlock.dexterity, 'dexterity');
    Game.propertyImplementation(
        ctx, this, StatisticsBlock.constitution, 'constitution');
    Game.propertyImplementation(
        ctx, this, StatisticsBlock.intelligence, 'intelligence');
    Game.propertyImplementation(ctx, this, StatisticsBlock.wisdom, 'wisdom');
    Game.propertyImplementation(
        ctx, this, StatisticsBlock.charisma, 'charisma');
  }

  private async roll(ctx: Core.Context, roll?: Core.DiceSpecification) {
    if (roll === undefined) {
      roll = Core.DiceGenerator.parse('drop(4d6,-1)');
    }

    const strengthRoll = ctx.diceGenerator.execute(roll);
    const dexterityRoll = ctx.diceGenerator.execute(roll);
    const constitutionRoll = ctx.diceGenerator.execute(roll);
    const intelligenceRoll = ctx.diceGenerator.execute(roll);
    const wisdomRoll = ctx.diceGenerator.execute(roll);
    const charismaRoll = ctx.diceGenerator.execute(roll);

    this.setState(ctx, {
      totalRolls: this.state.totalRolls + 1,

      strength: strengthRoll,
      dexterity: dexterityRoll,
      constitution: constitutionRoll,
      intelligence: intelligenceRoll,
      wisdom: wisdomRoll,
      charisma: charismaRoll,
    });
  }

  private async reroll(ctx: Core.Context) {
    this.setState(ctx, {
      totalRolls: this.state.totalRolls + 1,

      strength: ctx.diceGenerator.rerollAll(this.state.strength),
      dexterity: ctx.diceGenerator.rerollAll(this.state.dexterity),
      constitution: ctx.diceGenerator.rerollAll(this.state.constitution),
      intelligence: ctx.diceGenerator.rerollAll(this.state.intelligence),
      wisdom: ctx.diceGenerator.rerollAll(this.state.wisdom),
      charisma: ctx.diceGenerator.rerollAll(this.state.charisma),
    });
  }

  private getModifier(value: number|null) {
    if (value !== null) {
      return Math.floor((value - 10) / 2);
    } else {
      return null;
    }
  }
}

Core.Reflect.embed(module);