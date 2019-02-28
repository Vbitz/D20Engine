import * as Core from 'core';
import * as PF from 'd20/pf';

export class RootModule extends Core.Module {
  async onCreate(ctx: Core.Context): Promise<void> {
    await ctx.registerModule(new PF.Components.StatisticsBlock.Module());
    await ctx.registerModule(new PF.Components.Creature.Module());
  }
}