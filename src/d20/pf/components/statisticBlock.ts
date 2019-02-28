import * as Core from 'core';
import {publicField} from 'core/component';
import * as Game from 'libgame';

export interface StatisticsGenerationResult {
  newStatisticsBlock: StatisticsBlock;

  strengthRoll: Core.Dice.DiceResults;
  dexterityRoll: Core.Dice.DiceResults;
  constitutionRoll: Core.Dice.DiceResults;
  intelligenceRoll: Core.Dice.DiceResults;
  wisdomRoll: Core.Dice.DiceResults;
  charismaRoll: Core.Dice.DiceResults;
}

class StatisticsBlockState extends Core.StatefulObject {
  @publicField strength: number|null;
  @publicField dexterity: number|null;
  @publicField constitution: number|null;
  @publicField intelligence: number|null;
  @publicField wisdom: number|null;
  @publicField charisma: number|null;

  constructor() {
    super();

    this.strength = 10;
    this.dexterity = 10;
    this.constitution = 10;
    this.intelligence = 10;
    this.wisdom = 10;
    this.charisma = 10;
  }
}

export class StatisticsBlockModule extends Core.Module {
  async onCreate(ctx: Core.Context) {
    StatisticsBlock.registerGenerator(ctx);
  }
}

export class StatisticsBlock extends Core.Component<StatisticsBlockState> {
  static State = StatisticsBlockState;
  static Module = StatisticsBlockModule;

  // Global event declarations.
  static readonly generate = new Core.Event<
      (roll?: Core.DiceSpecification) => StatisticsGenerationResult>();

  // Property declarations.
  static strength = Game.Property<number|null>();
  static dexterity = Game.Property<number|null>();
  static constitution = Game.Property<number|null>();
  static intelligence = Game.Property<number|null>();
  static wisdom = Game.Property<number|null>();
  static charisma = Game.Property<number|null>();

  // Event declarations.
  static strengthModifier = new Core.Event<() => (number | null)>();
  static dexterityModifier = new Core.Event<() => (number | null)>();
  static constitutionModifier = new Core.Event<() => (number | null)>();
  static intelligenceModifier = new Core.Event<() => (number | null)>();
  static wisdomModifier = new Core.Event<() => (number | null)>();
  static charismaModifier = new Core.Event<() => (number | null)>();

  constructor() {
    super(new StatisticsBlockState());
  }

  static registerGenerator(ctx: Core.Context) {
    ctx.registerRootHandler(StatisticsBlock.generate, async (ctx, roll?) => {
      const newStatisticsBlock = new StatisticsBlock();

      if (roll === undefined) {
        roll = Core.DiceGenerator.parse('drop(4d6,-1)');
      }

      const strengthRoll = ctx.diceGenerator.execute(roll);
      const dexterityRoll = ctx.diceGenerator.execute(roll);
      const constitutionRoll = ctx.diceGenerator.execute(roll);
      const intelligenceRoll = ctx.diceGenerator.execute(roll);
      const wisdomRoll = ctx.diceGenerator.execute(roll);
      const charismaRoll = ctx.diceGenerator.execute(roll);

      newStatisticsBlock.load({
        strength: strengthRoll.value,
        dexterity: dexterityRoll.value,
        constitution: constitutionRoll.value,
        intelligence: intelligenceRoll.value,
        wisdom: wisdomRoll.value,
        charisma: charismaRoll.value,
      });

      return {
        newStatisticsBlock,

        strengthRoll,
        dexterityRoll,
        constitutionRoll,
        intelligenceRoll,
        wisdomRoll,
        charismaRoll
      };
    });
  }

  async onCreate(ctx: Core.Context) {
    async function getModifier(
        this: StatisticsBlock, event: Core.EventDeclaration,
        ctx: Core.Context) {
      const value = await ctx.callEvent(ctx.entity, event).call();

      if (value !== undefined) {
        return this.getModifier(value);
      } else {
        return null;
      }
    }

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

  private getModifier(value: number|null) {
    if (value !== null) {
      return Math.floor((value - 10) / 2);
    } else {
      return null;
    }
  }
}