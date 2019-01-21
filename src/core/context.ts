import * as Core from 'core';

export class Context extends Core.AbstractEventController {
  constructor(private game: Core.Game, private parent: Core.Context|null) {
    super();
  }

  get entity(): Core.Entity {
    return this._getEntity();
  }

  get diceGenerator(): Core.Dice.DiceGenerator {
    return this.game.diceGenerator;
  }

  /**
   * Register a "global" handler on this context. This will override handlers on
   * individual entities.
   * This method may be refactored into the patching system attached to
   * `Actions`.
   * @param evt The event to attach a handler to.
   * @param cb The callback for the handler.
   */
  registerGlobalHandler<T extends Core.EventSignature>(
      evt: T, cb: Core.HandlerCallback<T>) {
    this._registerHandler(evt, cb);
  }

  /**
   * Register a root handler. This is attached to the game instance and will be
   * called last in the event chain.
   * @param evt The event to attach a handler to.
   * @param cb The callback for the handler.
   */
  registerRootHandler<T extends Core.EventSignature>(
      evt: T, cb: Core.HandlerCallback<T>) {
    this.game.registerHandler(evt, cb);
  }

  /**
   * Register a handler on a specific entity. This should be used instead of
   * `Entity.registerHandler` as future changes may introduce additional
   * registration steps.
   * @param evt The event to attach a handler to.
   * @param cb The callback for the handler.
   */
  registerEntityHandler<T extends Core.EventSignature>(
      ent: Core.Entity, evt: T, cb: Core.HandlerCallback<T>) {
    ent.registerHandler(evt, cb);
  }

  /**
   * Register a handler on a specific component. This should be used instead of
   * `Component.registerHandler` as future changes may introduce additional
   * registration steps.
   * @param evt The event to attach a handler to.
   * @param cb The callback for the handler.
   */
  registerComponentHandler<T extends Core.EventSignature>(
      comp: Core.Component<Core.ComponentParameters>, evt: T,
      cb: Core.HandlerCallback<T>) {
    comp.registerHandler(evt, cb);
  }

  /**
   * Call an event on an entity.
   * @param ent The entity to use as the context to call the event with.
   * @param evt The event to call.
   * @param args A list of arguments to call the event with.
   */
  callEvent<T extends Core.EventSignature>(
      ent: Core.Entity, evt: T, ...args: Core.EventArgs<T>): Core.Action<T> {
    // TODO(joshua): Add parent handlers to this list.

    let eventHandlerList = this._getHandlers(evt);

    eventHandlerList = eventHandlerList.concat(ent.getHandlers(evt));

    const eventResult = this._callHandlers(this, evt, eventHandlerList, args);

    return eventResult;
  }

  /**
   * Call a root event.
   * @param evt The event to call.
   * @param args A list of arguments to call the event with.
   */
  callRootEvent<T extends Core.EventSignature>(
      evt: T, ...args: Core.EventArgs<T>): Core.Action<T> {
    // TODO(joshua): Add parent handlers to this list.

    const eventHandlerList = this.game.getHandlers(evt);

    const eventResult = this._callHandlers(this, evt, eventHandlerList, args);

    return eventResult;
  }

  createEntity() {
    /**
     * TODO(joshua): Expand this method.
     */
    return new Core.Entity();
  }

  /**
   * Cancel a handler by returning this value.
   * @param value The value to return from the event.
   */
  cancel<T extends Core.Event.EventReturnType>(value: T) {
    return new Core.Event.EventCancel(value);
  }

  protected _getEntity(): Core.Entity {
    throw new Error('Not Implemented');
  }
}

export class ModuleContext extends Context {}

export class EntityContext extends Context {
  constructor(
      game: Core.Game, parent: Core.Context, private _entity: Core.Entity) {
    super(game, parent);
  }

  protected _getEntity() {
    return this._entity;
  }
}