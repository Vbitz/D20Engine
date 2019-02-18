import * as Core from 'core';

export class Game extends Core.AbstractEventController {
  private context = new Core.Context(this, null);
  private _diceGenerator = new Core.Dice.DiceGenerator(this.random.bind(this));
  private entityList = new Set<Core.Entity>();
  private moduleList = new Set<Core.Module>();

  get diceGenerator() {
    return this._diceGenerator;
  }

  random() {
    return Math.random();
  }

  createEntity(ctx: Core.Context) {
    const newEntity = new Core.Entity();

    this.entityList.add(newEntity);

    return newEntity;
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
}