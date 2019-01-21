import * as Core from 'core';

export class Game extends Core.AbstractEventController {
  private context = new Core.Context(this, null);
  private _diceGenerator = new Core.Dice.DiceGenerator(this.random.bind(this));

  get diceGenerator() {
    return this._diceGenerator;
  }

  random() {
    return Math.random();
  }

  /**
   * Warning this method should normally be called from a Context as some
   * registration may not happen.
   * @param evt
   * @param cb The callback to be executed for the handler.
   */
  registerHandler<T extends Core.EventSignature>(
      evt: T, cb: Core.HandlerCallback<T>) {
    this._registerHandler(evt, cb);
  }

  /**
   * Get a list of the handlers on this entity. This is only public to be used
   * by `Context`.
   * @param evt The event to get handlers for.
   */
  getHandlers<T extends Core.EventSignature>(evt: T) {
    return this._getHandlers(evt);
  }

  /**
   * Register and initialize a module within this `Game` instance.
   * @param mod The module to register.
   */
  async registerModule(mod: Core.Module) {
    const moduleContext = new Core.ModuleContext(this, this.context);
    await mod.onCreate(moduleContext);
  }
}