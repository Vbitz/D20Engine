import * as Core from 'core';

export interface EntitySave {
  engineVersion: string;
  components: Core.ComponentSave[];
}

export class Entity extends Core.AbstractEventController {
  readonly uuid = Core.Common.createUUID();

  private componentList: Array<Core.Component<Core.StatefulObject>> = [];

  get components() {
    // Shallow copy the components array.
    return [...this.componentList];
  }

  /**
   * Warning this method should normally be called from a Context as some
   * registration may not happen.
   * @param evt
   * @param cb The callback to be executed for the handler.
   */
  registerHandler<T extends Core.EventDeclaration>(
      evt: T, cb: Core.HandlerCallback<T>) {
    this._registerHandler(evt, cb);
  }

  /**
   * Get a list of the handlers on this entity. This is only public to be used
   * by `Context`.
   * @param evt The event to get handlers for.
   */
  getHandlers<T extends Core.EventDeclaration>(evt: T) {
    return this._getHandlers(evt).concat(
        ...this.componentList.map((comp) => comp.getHandlers(evt)));
  }

  async executeRPC(
      ctx: Core.Context, rpcCtx: Core.RPC.Context,
      chain: Core.Value[]): Promise<void> {
    if (chain.length === 0) {
      // Empty chains invoke the help command.
      await this._executeRPC(ctx, rpcCtx, chain);

      for (const component of this.componentList) {
        await component.executeRPC(ctx, rpcCtx, chain);
      }

      return;
    }

    if (this.hasRPCMarshal(chain)) {
      return await this._executeRPC(ctx, rpcCtx, chain);
    }

    for (const component of this.componentList) {
      if (component.hasRPCMarshal(chain)) {
        return await component.executeRPC(ctx, rpcCtx, chain);
      }
    }

    throw new Core.RPC.MarshalNotFoundError('');
  }

  addRPCMarshal(
      name: string, helpText: string,
      marshalCallback: Core.RPC.MarshalCallback) {
    return this._addRPCMarshal(name, helpText, marshalCallback);
  }

  hasRPCMarshal(chain: Core.Value[]) {
    return this._hasRPCMarshal(chain);
  }

  generateGraph(graphInterface: Core.GraphInterface) {
    graphInterface.addNode(this.uuid, 'Entity');
    this._generateGraph(this.uuid, graphInterface);

    for (const component of this.componentList) {
      const componentId = component.generateGraph(graphInterface);
      graphInterface.addEdge(this.uuid, componentId);
    }
  }

  async addComponent(
      ctx: Core.Context, comp: Core.Component<Core.StatefulObject>) {
    this.componentList.push(comp);

    comp.setOwner(this);

    await comp.onCreate(ctx);
  }

  async save(): Promise<EntitySave> {
    const engineVersion = await Core.getVersion();

    const components: Core.ComponentSave[] = [];

    for (const component of this.componentList) {
      components.push(await component.save());
    }

    return {components, engineVersion};
  }

  async load(ctx: Core.Context, save: EntitySave) {
    const currentEngineVersion = await Core.getVersion();

    if (save.engineVersion !== currentEngineVersion) {
      // TODO(joshua): Fix this. This will get really annoying.
      throw new Error(`Engine Version mismatch: (Save: ${
          save.engineVersion}, Current ${currentEngineVersion})`);
    }

    for (const component of save.components) {
      const loadedComponent = await ctx.loadComponentFromSave(component);

      this.componentList.push(loadedComponent);

      loadedComponent.setOwner(this);

      await loadedComponent.onCreate(ctx);
    }
  }
}