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

    this.addRPCMarshal('ct', async (ctx, rpcCtx, chain) => {
      const character = await this.getCharacter(ctx, rpcCtx.getUserID());

      return await rpcCtx.chainRPC(ctx, character, chain);
    });

    this.addRPCMarshal('lookup', async (ctx, rpcCtx, chain) => {
      return await rpcCtx.chainRPC(ctx, this.databaseLookup!, chain);
    });

    this.addRPCAlias('findSpell', ['lookup', 'spell', 'search']);
    this.addRPCAlias('findMonster', ['lookup', 'monster', 'search']);
    this.addRPCAlias('findMagicItem', ['lookup', 'magicItem', 'search']);

    this.addRPCAlias('getSpell', ['lookup', 'spell', 'get']);
    this.addRPCAlias('getMonster', ['lookup', 'monster', 'get']);
    this.addRPCAlias('getMagicItem', ['lookup', 'magicItem', 'get']);
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