import * as Core from 'core';
import * as PF from 'd20/pf';
import * as Game from 'libgame';

/**
 *
 * @param {Core.Context} ctx
 */
export function makeFighter(ctx) {
  const ent = ctx.createEntity();

  // I'm not sure how I'll do stat blocks. Maybe I'll allow a roll and otherwise
  // defer to point buy.
  await ent.addComponent(ctx, new PF.StatisticsBlock());

  // While Creature controls things like health most of this is set by the
  // player class.
  await ent.addComponent(ctx, new PF.Creature().load());

  await ent.addComponent(ctx, new PF.Player().load());

  await ctx.callRootEvent(PF.RaceRegistry.addRaceToEntity, 'pf.race.human');

  await ctx.callRootEvent(
      PF.ClassRegistry.addClassToEntity, 'pf.class.fighter');

  return ent;
}