import * as Core from 'core';

export type CreateCreatureCallback = (ctx: Core.Context) => Core.Entity;

export const registerCreature: (name: string, cb: CreateCreatureCallback) =>
    void = 'd20.creature_registry.register' as Core.EventDeclaration;

export const createCreature: (name: string) => Core.Entity =
    'd20.creature_registry.create' as Core.EventDeclaration;

export const createCreatureRegistry: () => void =
    'd20.creature_registry.create' as Core.EventDeclaration;

class CreatureRegistry {
  register(name: string, cb: CreateCreatureCallback) {
    throw new Error('Not Implemented');
  }
}

export class CreatureRegistryModule extends Core.Module {
  async onCreate(ctx: Core.Context) {
    // TODO(joshua): Why is this a root handler and not a post-init callback. It
    // could even be a private member of this class. That would also make
    // serialization easier since Modules could be saved.
    ctx.registerRootHandler(createCreatureRegistry, async (ctx) => {
      const creatureRegistry = new CreatureRegistry();

      ctx.registerRootHandler(registerCreature, async (ctx, name, cb) => {
        creatureRegistry.register(name, cb);
      });

      ctx.registerRootHandler(createCreature, async (ctx, name) => {
        throw new Error('Not Implemented');
      });
    });
  }
}