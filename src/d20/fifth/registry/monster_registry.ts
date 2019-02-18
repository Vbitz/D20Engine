import * as Core from 'core';

export type CreateMonsterCallback = (ctx: Core.Context) => Core.Entity;

export const registerMonster =
    new Core.Event<(name: string, cb: CreateMonsterCallback) => void>();

export const createMonster = new Core.Event<(name: string) => Core.Entity>();

export class CreatureRegistryModule extends Core.Module {
  register(name: string, cb: CreateMonsterCallback) {
    throw new Error('Not Implemented');
  }

  createMonster(name: string): Core.Entity {
    throw new Error('Not Implemented');
  }

  async onCreate(ctx: Core.Context) {
    // TODO(joshua): Why is this a root handler and not a post-init callback. It
    // could even be a private member of this class. That would also make
    // serialization easier since Modules could be saved.

    ctx.registerRootHandler(registerMonster, async (ctx, name, cb) => {
      this.register(name, cb);
    });

    ctx.registerRootHandler(createMonster, async (ctx, name) => {
      return this.createMonster(name);
    });
  }
}