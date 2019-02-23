import * as Core from 'core';

export class GraphInterface {
  private symbolMap: Map<symbol, string> = new Map();

  private declarations: string[] = [];

  addNode(id: string|symbol, label?: string) {
    if (label === undefined) {
      label = this.getSymbol(id);
    }
    this.declarations.push(
        `${this.getSymbol(id)} [label=${JSON.stringify(label)}];`);
  }

  addEdge(a: string|symbol, b: string|symbol) {
    this.declarations.push(`${this.getSymbol(a)} -> ${this.getSymbol(b)};`);
  }

  export(): string {
    return `digraph G {\n${this.declarations.join('\n')}\n}`;
  }

  private getSymbol(a: string|symbol): string {
    if (typeof (a) === 'symbol') {
      if (!this.symbolMap.has(a)) {
        this.symbolMap.set(a, Core.Common.createUUID());
      }
      return this.symbolMap.get(a)!;
    } else {
      return a;
    }
  }
}

export class Game extends Core.AbstractEventController {
  id = Symbol('Game');

  private context = new Core.Context(this, null);
  private _diceGenerator = new Core.Dice.DiceGenerator(this.random.bind(this));
  private entityList = new Set<Core.Entity>();
  private moduleList = new Set<Core.Module>();
  private transientEntityList = new WeakSet<Core.Entity>();

  get diceGenerator() {
    return this._diceGenerator;
  }

  random() {
    return Math.random();
  }

  /**
   * Create a persistent entity. Warning this method may leak memory due to how
   * it overrides the lifetime of the object.
   * @param ctx
   */
  createEntity(ctx: Core.Context) {
    const newEntity = new Core.Entity();

    this.entityList.add(newEntity);

    return newEntity;
  }

  /**
   * Create an entity not attached to the global entity list. This shouldn't be
   * persisted and should be freed by the garbage collector once it leaves local
   * scope. This function is a stop gap fix until entities are attached to
   * contexts instead of the global game object.
   * @param ctx
   */
  createTransientEntity(ctx: Core.Context) {
    const newEntity = new Core.Entity();

    this.transientEntityList.add(newEntity);

    return newEntity;
  }

  /**
   * Checks to see if an entity is transient.
   * @param ent
   */
  isTransient(ent: Core.Entity) {
    return this.transientEntityList.has(ent);
  }

  createRPCServer(root: Core.Entity) {
    return new Core.RPC.Server(
        this, root, new Core.Context(this, this.context));
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
    return this._getHandlers(evt);
  }

  // This method is a bit of a high level cheat to create a context and make a
  // call inside it. Normally this is suposed to be done inside a module as they
  // persist in the game state. The context this function creates is insteed
  // transient.
  async contextCall<T>(cb: (ctx: Core.Context) => Promise<T>) {
    const newContext = new Core.Context(this, this.context);

    return await cb(newContext);
  }

  /**
   * Register and initialize a module within this `Game` instance.
   * @param mod The module to register.
   */
  async registerModule(mod: Core.Module) {
    const moduleContext = new Core.ModuleContext(this, this.context);

    this.context.addChildContext(moduleContext);

    await mod.onCreate(moduleContext);

    this.moduleList.add(mod);
  }

  /**
   * Generate a event graph in GraphVis format.
   */
  generateEventGraph(): string {
    const graphInterface = new GraphInterface();

    this._generateGraph(this.id, graphInterface);

    for (const mod of this.moduleList) {
      graphInterface.addNode(mod.uuid);
    }

    for (const entity of this.entityList) {
      graphInterface.addNode(entity.uuid);
      entity.generateGraph(graphInterface);
    }

    return graphInterface.export();
  }
}