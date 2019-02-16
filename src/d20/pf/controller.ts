import * as Core from 'core';
import * as PF from 'd20/pf';

export class ControllerParameters extends Core.ComponentParameters {}

export class Controller extends Core.Component<ControllerParameters> {
  private characterList: Map<string, Core.Entity> = new Map();

  constructor() {
    super(new ControllerParameters());
  }

  async onCreate(ctx: Core.Context) {
    this.addRPCMarshal('ct', async (ctx, rpcCtx, chain) => {
      const character = await this.getCharacter(ctx, rpcCtx.getUserID());

      return await rpcCtx.chainRPC(ctx, character, chain);
    });
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