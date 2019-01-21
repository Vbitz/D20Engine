import * as Core from 'core';
import * as Fifth from 'd20/fifth';

export const createEncounter: () => Core.Entity =
    'd20.fifth.combat.encounter.create' as Core.EventDeclaration;

export const addCreature: (entity: Core.Entity) => void =
    'd20.fifth.combat.encounter.addCreature' as Core.EventDeclaration;

export const startEncounter: () => void =
    'd20.fifth.combat.encounter.start' as Core.EventDeclaration;

export const stopEncounter: () => void =
    'd20.fifth.combat.encounter.stop' as Core.EventDeclaration;

export interface EncounterParameters extends Core.ComponentParameters {}

class EncounterCreature {
  initiative: number|undefined = undefined;

  constructor(readonly entity: Core.Entity) {}
}

export class Encounter extends Core.Component<EncounterParameters> {
  private creatures: EncounterCreature[] = [];

  private running = false;

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
  }

  private async start(ctx: Core.Context) {
    // Roll initiative for all creatures.
    for (const creature of this.creatures) {
      // TODO(joshua): Handle publishing initiative rolls.
      const initiativeRoll =
          await ctx.callEvent(creature.entity, Fifth.Creature.getInitiativeRoll)
              .call();

      creature.initiative = initiativeRoll;

      console.log(creature.initiative);
    }

    // Sort the turn order and start running turns for creatures.
    this.sortCreatures();

    this.running = true;

    // while (this.running) {
    // }
  }

  private sortCreatures() {
    this.creatures = this.creatures.sort(
        (a, b) => (a.initiative || 0) - (b.initiative || 0));
  }
}

export class EncounterModule extends Core.Module {
  async onCreate(ctx: Core.Context) {
    ctx.registerRootHandler(createEncounter, async (ctx) => {
      return this.createEncounter(ctx);
    });
  }

  private createEncounter(ctx: Core.Context) {
    const ent = ctx.createEntity();

    ent.addComponent(ctx, new Encounter({}));

    return ent;
  }
}