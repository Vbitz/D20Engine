import * as Core from 'core';
import * as PF from 'd20/pf';

export class ControllerParameters extends Core.ComponentParameters {}

export class Controller extends Core.Component<ControllerParameters> {
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