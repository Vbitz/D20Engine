import * as Core from 'core';
import * as PF from 'd20/pf';

class DeveloperCommandsParameters extends Core.StatefulObject {}

export class DeveloperCommands extends
    Core.Component<DeveloperCommandsParameters> {
  static readonly Parameters = DeveloperCommandsParameters;

  private entities: Map<string, Core.Entity> = new Map();

  constructor() {
    super(new DeveloperCommandsParameters());
  }

  async onCreate(ctx: Core.Context): Promise<void> {
    this.addRPCMarshal(
        'createEnt', ' : Create a new Entity', async (ctx, rpcCtx, chain) => {
          const newEnt = ctx.createTransientEntity();
          const entName = newEnt.uuid;

          this.entities.set(entName, newEnt);

          await rpcCtx.replyUser(`Entity ${entName} created.`);
        });

    this.addRPCMarshal(
        'deleteEntity', '<name> : Delete a Entity',
        async (ctx, rpcCtx, chain) => {
          const [entName, ...nextChain] = chain;

          const ent = this.getEntity(entName);

          if (ent === undefined) {
            await rpcCtx.reply(`Entity ${entName} not found.`);

            return;
          }

          this.entities.delete(Core.asString(entName));
        });

    this.addRPCMarshal(
        'getEntity', '<name> : Access method on Entity',
        async (ctx, rpcCtx, chain) => {
          const [entName, ...nextChain] = chain;

          const ent = this.getEntity(entName);

          if (ent === undefined) {
            await rpcCtx.replyUser(`Entity ${entName} not found.`);

            return;
          }

          await rpcCtx.chainRPC(ctx, ent, nextChain);
        });

    this.addRPCMarshal(
        'listComponents', ' : Get a list of all registered components',
        async (ctx, rpcCtx, chain) => {
          const constructors = Core.Reflect.getConstructors();

          await rpcCtx.replyUser(JSON.stringify(constructors));
        });

    this.addRPCMarshal(
        'addComponent', '<ent> <component> : Add a component to a entity.',
        async (ctx, rpcCtx, chain) => {
          const [entName, componentName, ...nextChain] = chain;

          const ent = this.getEntity(entName);

          if (ent === undefined) {
            await rpcCtx.replyUser(`Entity ${entName} not found.`);

            return;
          }

          const componentNameString = Core.asString(componentName);

          if (!Core.Reflect.hasConstructor(componentNameString)) {
            await rpcCtx.reply(`Constructor ${componentName} does not Exist.`);

            return;
          }

          if (!Core.Reflect.isComponentConstructor(componentNameString)) {
            await rpcCtx.reply(
                `Constructor ${componentName} is not a Component.`);

            return;
          }

          const newComponent = Core.Reflect.create(componentNameString);

          if (!(newComponent instanceof Core.Component)) {
            throw new Error('Not Implemented');
          }

          await ent.addComponent(ctx, newComponent);
        });
  }

  private getEntity(entName: Core.Value): Core.Entity|undefined {
    if (!this.entities.has(Core.asString(entName))) {
      return undefined;
    } else {
      return this.entities.get(Core.asString(entName))!;
    }
  }
}

Core.Reflect.embed(module);