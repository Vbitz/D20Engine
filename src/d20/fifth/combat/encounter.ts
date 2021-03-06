import * as Core from 'core';
import * as Fifth from 'd20/fifth';

export const createEncounter = new Core.Event<() => Core.Entity>();

export const addCreature = new Core.Event<(entity: Core.Entity) => void>();

export const startEncounter = new Core.Event<() => void>();

export const stopEncounter = new Core.Event<() => void>();

export const getEncounter = new Core.Event<() => Core.Entity>();

export const getParticipants = new Core.Event<() => Core.Entity[]>();

export class EncounterParameters extends Core.StatefulObject {}

class EncounterCreature {
  initiative: number|undefined = undefined;

  dead = false;

  constructor(readonly entity: Core.Entity) {}
}

export class Encounter extends Core.Component<EncounterParameters> {
  private creatures: EncounterCreature[] = [];

  private running = false;

  constructor() {
    super(new EncounterParameters());
  }

  async onCreate(ctx: Core.Context) {
    ctx.registerComponentHandler(this, addCreature, async (ctx, entity) => {
      // TODO(joshua): Validate that this entity is described as a creature.
      this.creatures.push(new EncounterCreature(entity));
    });

    ctx.registerComponentHandler(this, startEncounter, async (ctx) => {
      await this.start(ctx);
    });

    ctx.registerComponentHandler(this, stopEncounter, async (ctx) => {
      this.running = false;
    });

    ctx.registerComponentHandler(this, getParticipants, async (ctx) => {
      return this.getParticipants();
    });
  }

  private async start(ctx: Core.Context) {
    // Roll initiative for all creatures.
    for (const creature of this.creatures) {
      // TODO(joshua): Handle publishing initiative rolls.
      const initiativeRoll =
          await ctx.callEvent(creature.entity, Fifth.Creature.getInitiativeRoll)
              .call();

      if (initiativeRoll === undefined) {
        throw new Error('Entity did not respond with an initiative roll.');
      }

      const rollResults = ctx.diceGenerator.execute(initiativeRoll);

      creature.initiative = rollResults.value;
    }

    // Sort the turn order and start running turns for creatures.
    this.sortCreatures();

    this.running = true;

    while (this.running) {
      for (const creature of this.creatures) {
        await this.executeTurn(ctx, creature);

        if (this.areAllOpponentsDead()) {
          this.running = false;
          break;
        }
      }
    }
  }

  private areAllOpponentsDead() {
    return this.creatures.filter((creature) => !creature.dead).length < 2;
  }

  private getParticipants() {
    return [...this.creatures].map((creature) => creature.entity);
  }

  private sortCreatures() {
    this.creatures = this.creatures.sort(
        (a, b) => (a.initiative || 0) - (b.initiative || 0));
  }

  private async executeTurn(ctx: Core.Context, creature: EncounterCreature) {
    // TODO(joshua): Pre-Turn

    await ctx.callEvent(creature.entity, Fifth.Creature.doTurn)
        .addPatch(
            Fifth.Combat.Encounter.getEncounter,
            async () => {
              return ctx.entity;
            })
        .call();

    const isDead =
        await ctx.callEvent(creature.entity, Fifth.Creature.isDead).call();

    if (isDead) {
      creature.dead = true;
    }

    // TODO(joshua): Post-Turn
  }
}

export class EncounterModule extends Core.Module {
  async onCreate(ctx: Core.Context) {
    ctx.registerRootHandler(createEncounter, async (ctx) => {
      return await this.createEncounter(ctx);
    });
  }

  private async createEncounter(ctx: Core.Context) {
    const ent = ctx.createEntity();

    await ent.addComponent(ctx, new Encounter());

    return ent;
  }
}