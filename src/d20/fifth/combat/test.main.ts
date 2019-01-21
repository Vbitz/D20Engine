import * as Core from 'core';
import * as Fifth from 'd20/fifth';

export class EncounterTestModule extends Core.Module {
  async onCreate(ctx: Core.Context) {
    const encounter =
        await (
            ctx.callRootEvent(Fifth.Combat.Encounter.createEncounter).call()) ||
        Core.Common.expect();

    const testCreature1 = ctx.createEntity();

    await testCreature1.addComponent(ctx, new TestCreature({}));

    const testCreature2 = ctx.createEntity();

    await testCreature2.addComponent(ctx, new TestCreature({}));

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

export interface TestCreatureParameters extends Core.ComponentParameters {}

export class TestCreature extends Core.Component<TestCreatureParameters> {
  async onCreate(ctx: Core.Context) {
    ctx.registerComponentHandler(
        this, Fifth.Creature.getInitiativeRoll, async (ctx) => {
          return ctx.diceGenerator.parseAndExecute('d20').value;
        });
  }
}

export async function combatTestMain(args: string[]) {
  const game = new Core.Game();

  await game.registerModule(new Fifth.Combat.EncounterModule());
  await game.registerModule(new EncounterTestModule());

  return 0;
}