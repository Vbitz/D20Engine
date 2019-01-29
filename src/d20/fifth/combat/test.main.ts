import * as Core from 'core';
import * as Fifth from 'd20/fifth';

export class EncounterTestModule extends Core.Module {
  async onCreate(ctx: Core.Context) {
    const encounter =
        await (ctx.callRootEvent(Fifth.Combat.Encounter.createEncounter).call())
        || Core.Common.expect();

    const testCreature1 = ctx.createEntity();

    await testCreature1.addComponent(ctx, new TestCreature());

    const testCreature2 = ctx.createEntity();

    await testCreature2.addComponent(ctx, new TestCreature());

    await ctx
        .callEvent(encounter, Fifth.Combat.Encounter.addCreature, testCreature1)
        .call();

    await ctx
        .callEvent(encounter, Fifth.Combat.Encounter.addCreature, testCreature2)
        .call();

    await ctx.callEvent(encounter, Fifth.Combat.Encounter.startEncounter)
        .call();
  }
}

export class TestCreatureParameters extends Core.ComponentParameters {}

export class TestCreature extends Core.Component<TestCreatureParameters> {
  private weapon: Core.Entity|undefined = undefined;

  private maxHitPoints = 10;
  private currentHitPoints = 10;

  constructor() {
    super(new TestCreatureParameters());
  }

  async onCreate(ctx: Core.Context) {
    this.weapon = this.createMeleeWeapon(ctx);

    ctx.registerComponentHandler(
        this, Fifth.Creature.getInitiativeRoll, async (ctx) => {
          return Core.Dice.DiceGenerator.parse('d20');
        });

    ctx.registerComponentHandler(
        this, Fifth.Creature.getArmorClass, async (ctx) => {
          return Core.Dice.DiceGenerator.constant(10);
        });

    ctx.registerComponentHandler(
        this, Fifth.Creature.getHitPoints, async (ctx) => {
          return Core.Dice.DiceGenerator.constant(this.currentHitPoints);
        });

    ctx.registerComponentHandler(this, Fifth.Creature.isDead, async (ctx) => {
      return this.currentHitPoints <= 0;
    });

    ctx.registerComponentHandler(this, Fifth.Creature.doTurn, async (ctx) => {
      const encounter =
          await ctx.callEvent(ctx.entity, Fifth.Combat.Encounter.getEncounter)
              .call();

      if (encounter === undefined) {
        throw new Error('Could not get encounter');
      }

      const participants =
          await ctx.callEvent(encounter, Fifth.Combat.Encounter.getParticipants)
              .call();

      if (participants === undefined) {
        throw new Error('Could not get participants');
      }

      const otherParticipants =
          participants.filter((ent) => ent !== ctx.entity);

      const randomTarget =
          otherParticipants[(Math.random() * otherParticipants.length) | 0];

      await ctx
          .callEvent(
              ctx.entity, Fifth.Creature.doAttack, {target: randomTarget})
          .call();
    });

    ctx.registerComponentHandler(
        this, Fifth.Creature.doAttack, async (ctx, args) => {
          if (this.weapon === undefined) {
            throw new Error('Weapon not Initialized');
          }

          const combatResults =
              await ctx
                  .callRootEvent(Fifth.Combat.Combat.runCombat, {
                    source: ctx.entity,
                    target: args.target,
                    action: this.weapon
                  })
                  .call();

          if (combatResults === undefined) {
            throw new Error('No combatResult Defined');
          }

          console.log(
              'uuid=', ctx.entity.uuid, 'hitPoints=',
              ctx.diceGenerator
                  .execute(
                      await ctx
                          .callEvent(ctx.entity, Fifth.Creature.getHitPoints)
                          .call()
                      || Core.DiceGenerator.constant(0))
                  .value,
              'hit=', combatResults.hit, 'defense=',
              combatResults.defenseResult ? combatResults.defenseResult.value :
                                            -1,
              'attack=',
              combatResults.attackResult ? combatResults.attackResult.value :
                                           -1,
              'damage=',
              combatResults.damageResult ? combatResults.damageResult.value :
                                           -1);
        });

    ctx.registerComponentHandler(
        this, Fifth.Creature.doDamage, async (ctx, args) => {
          const finalDamageRoll = ctx.diceGenerator.execute(args.amount);

          this.currentHitPoints -= finalDamageRoll.value;

          return finalDamageRoll;
        });
  }

  private createMeleeWeapon(ctx: Core.Context) {
    const ent = ctx.createEntity();

    ent.addComponent(ctx, new TestWeapon());

    return ent;
  }
}

export class TestWeaponParameters extends Core.ComponentParameters {}

export class TestWeapon extends Core.Component<TestWeaponParameters> {
  constructor() {
    super(new TestWeaponParameters());
  }

  async onCreate(ctx: Core.Context) {
    ctx.registerComponentHandler(
        this, Fifth.MeleeAttackAction.getAttackRoll, async (ctx) => {
          return Core.DiceGenerator.parse('d20+2');
        });

    ctx.registerComponentHandler(
        this, Fifth.MeleeAttackAction.getDamageRoll, async (ctx) => {
          return Core.DiceGenerator.parse('d6');
        });
  }
}

export async function combatTestMain(args: string[]) {
  const game = new Core.Game();

  await game.registerModule(new Fifth.Combat.CombatModule());
  await game.registerModule(new Fifth.Combat.EncounterModule());
  await game.registerModule(new EncounterTestModule());

  return 0;
}