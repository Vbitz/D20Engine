import * as Core from 'core';
import * as PF from 'd20/pf';

class ControllerParameters extends Core.StatefulObject {}

function forceSign(v: number|null) {
  return (v || 0) > 0 ? '+' + (v || 0).toString(10) : (v || 0).toString(10);
}

export class Controller extends Core.Component<ControllerParameters> {
  static readonly Parameters = ControllerParameters;

  private databaseLookup: Core.Entity|null = null;

  private characterList: Map<string, Core.Entity> = new Map();

  constructor() {
    super(new ControllerParameters());
  }

  async onCreate(ctx: Core.Context) {
    this.databaseLookup = ctx.createEntity();

    await this.databaseLookup.addComponent(ctx, new PF.DatabaseLookup());

    this.addRPCMarshal(
        'ct', ' : (BETA) Character Tracker', async (ctx, rpcCtx, chain) => {
          const character = await this.getCharacter(ctx, rpcCtx.getUserID());

          return await rpcCtx.chainRPC(ctx, character, chain);
        });

    this.addRPCMarshal(
        'rollStats',
        '<roll> : Roll a set of character statistics using dice roll <roll>',
        async (ctx, rpcCtx, chain) => {
          return await this.rollStats(ctx, rpcCtx, chain);
        });

    this.addRPCMarshal(
        'lookup', ' : Database Lookup', async (ctx, rpcCtx, chain) => {
          return await rpcCtx.chainRPC(ctx, this.databaseLookup!, chain);
        });

    this.addRPCAlias(
        'findSpell', '<searchTerm> : Search for a spell.',
        ['lookup', 'spell', 'search']);
    this.addRPCAlias(
        'findMonster', '<searchTerm> : Search for a monster.',
        ['lookup', 'monster', 'search']);
    this.addRPCAlias(
        'findMagicItem', '<searchTerm> : Search for a magic item.',
        ['lookup', 'magicItem', 'search']);
    this.addRPCAlias(
        'findItem', '<searchTerm> : Search for a magic item.',
        ['lookup', 'magicItem', 'search']);
    this.addRPCAlias(
        'findFeat', '<searchTerm> : Search for a feat.',
        ['lookup', 'feat', 'search']);

    this.addRPCAlias(
        'getSpell',
        '<name> -full : Get details on a spell. Pass -full for complete details.',
        ['lookup', 'spell', 'get']);
    this.addRPCAlias(
        'getMonster',
        '<name> -full : Get details on a monster. Pass -full for complete details.',
        ['lookup', 'monster', 'get']);
    this.addRPCAlias(
        'getMagicItem',
        '<name> -full : Get details on a magic item. Pass -full for complete details.',
        ['lookup', 'magicItem', 'get']);
    this.addRPCAlias(
        'getItem',
        '<name> -full : Get details on a magic item. Pass -full for complete details.',
        ['lookup', 'magicItem', 'get']);
    this.addRPCAlias(
        'getFeat',
        '<name> -full : Get details on a feat. Pass -full for complete details.',
        ['lookup', 'feat', 'get']);
  }

  async rollStats(
      ctx: Core.Context, rpcCtx: Core.RPC.Context, chain: Core.Value[]) {
    let [roll] = chain;

    if (roll === undefined) {
      roll = 'drop(4d6,-1)';
    }

    const parsed = Core.Dice.DiceGenerator.parse(Core.asString(roll));

    if (Core.Dice.DiceGenerator.getComplexity(parsed) > 50) {
      throw new Error('Nice Try..');
    }

    const newCharacter = ctx.createTransientEntity();

    const generationResults =
        await ctx.callRootEvent(PF.StatisticsBlock.generate, parsed).call();

    if (generationResults === undefined) {
      throw new Error('Could not call StatisticsBlock.generate');
    }

    await newCharacter.addComponent(ctx, generationResults.newStatisticsBlock);

    const [str, dex, con, int, wis, cha] = await Promise.all([
      PF.StatisticsBlock.strength.get, PF.StatisticsBlock.dexterity.get,
      PF.StatisticsBlock.constitution.get, PF.StatisticsBlock.intelligence.get,
      PF.StatisticsBlock.wisdom.get, PF.StatisticsBlock.charisma.get
    ].map((ev) => ctx.callEvent(newCharacter, ev).callChecked()));

    const [strMod, dexMod, conMod, intMod, wisMod, chaMod] = await Promise.all([
      PF.StatisticsBlock.strengthModifier, PF.StatisticsBlock.dexterityModifier,
      PF.StatisticsBlock.constitutionModifier,
      PF.StatisticsBlock.intelligenceModifier,
      PF.StatisticsBlock.wisdomModifier, PF.StatisticsBlock.charismaModifier
    ].map((ev) => ctx.callEvent(newCharacter, ev).callChecked()));

    const modifierTotal =
        [strMod, dexMod, conMod, intMod, wisMod, chaMod].reduce(
            (a, b) => (a || 0) + (b || 0), 0);

    await rpcCtx.reply(`
**Strength**:         {${
                           Core.DiceGenerator.explain(
                               generationResults.strengthRoll)}} + {} = **${
                           str}** (${forceSign(strMod)})
**Dexterity**:        {${
                           Core.DiceGenerator.explain(
                               generationResults.dexterityRoll)}} + {} = **${
                           dex}** (${forceSign(dexMod)})
**Constitution**:     {${
                           Core.DiceGenerator.explain(
                               generationResults.constitutionRoll)}} + {} = **${
                           con}** (${forceSign(conMod)})
**Intelligence**:     {${
                           Core.DiceGenerator.explain(
                               generationResults.intelligenceRoll)}} + {} = **${
                           int}** (${forceSign(intMod)})
**Wisdom**:           {${
                           Core.DiceGenerator.explain(
                               generationResults.wisdomRoll)}} + {} = **${
                           wis}** (${forceSign(wisMod)})
**Charisma**:         {${
                           Core.DiceGenerator.explain(
                               generationResults.charismaRoll)}} + {} = **${
                           cha}** (${forceSign(chaMod)})
**Total Modifiers**:  ${forceSign(modifierTotal)}
    `.trim());
  }

  private async getCharacter(ctx: Core.Context, id: string):
      Promise<Core.Entity> {
    if (!this.characterList.has(id)) {
      const newEntity = ctx.createEntity();

      newEntity.addComponent(ctx, new PF.CharacterTracker());

      this.characterList.set(id, newEntity);
    }

    return this.characterList.get(id)!;
  }
}