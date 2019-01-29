import * as Core from 'core';
import * as Fifth from 'd20/fifth';

function createCommoner(ctx: Core.Context) {
  const ent = ctx.createEntity();

  // I'm not really sure how Creature and Monster are going to split
  // up at this stage. I assume players will inherit Creature but not
  // Monster. Although that being said players will override most of
  // these items with their own Component that calculates these values
  // dynamically.
  ent.addComponent(ctx, new Fifth.Creature.Creature().load({
    size: Fifth.Size.Medium,
    type: Fifth.CreatureType.Humanoid,

    armorClass: 10,
    hitPointsRoll: '1d8',
    speed: 30,

    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,

    passivePerception: 10
  }));

  ent.addComponent(
      ctx, new Fifth.Monster.Monster().load({challenge: Fifth.Challenge.Zero}));

  const clubAction = 'club';

  ent.addComponent(ctx, new Fifth.MeleeAttackAction.MeleeAttackAction().load({
    name: clubAction,
    hitBonus: 2,
    reach: 5,
    // I don't define target count here. After reviewing the SRD it seems
    // like there is always 1 target and special cases will have different
    // components.
    damageRoll: '1d4',
    damageType: Fifth.DamageType.Bludgeoning
  }));

  ent.addComponent(
      ctx,
      new Fifth.BasicMonsterAI.BasicMonsterAI().load({action: [clubAction]}));

  return ent;
}

export class Commoner extends Core.Module {
  async onCreate(ctx: Core.Context): Promise<void> {
    // I could implement a mechanism where Modules are required here.

    // While I could implement this a handler a single registry makes sense
    // as it simplifies the event system.
    ctx.callRootEvent(
        Fifth.MonsterRegistry.registerMonster, Fifth.NPCInstance.Commoner,
        createCommoner);
  }
}