import * as Core from 'core';
import * as Fifth from 'd20/fifth';

function createCommoner(ctx: Core.Context) {
  const ent = ctx.createEntity();

  // ent.addComponent(new Fifth.Creature());

  return ent;
}

export class Commoner extends Core.Module {
  async onCreate(ctx: Core.Context) {
    // TODO(joshua): There should be a enum containing all NPCs and monsters.
    ctx.callRootEvent(
        Fifth.MonsterRegistry.registerMonster, 'd20.creature.npc.commoner',
        createCommoner);
  }
}