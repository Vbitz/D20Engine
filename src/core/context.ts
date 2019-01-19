import * as Core from 'core';

export class Context extends Core.Event.EventController {
  constructor(private game: Core.Game) {
    super();
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
    this._registerHandler(evt, cb);
  }

  /**
   * Register a handler on a specific entity. This should be used instead of
   * `Entity.registerHandler` as future changes may introduce additional
   * registration steps.
   * @param evt The event to attach a handler to.
   * @param cb The callback for the handler.
   */
  registerHandler<T extends Core.EventSignature>(
      ent: Core.Entity, evt: T, cb: Core.HandlerCallback<T>) {
    ent.registerHandler(evt, cb);
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
   * Call a global event.
   * @param evt The event to call.
   * @param args A list of arguments to call the event with.
   */
  callGlobalEvent<T extends Core.EventSignature>(
      evt: T, ...args: Core.EventArgs<T>): Core.Action<T> {
    // TODO(joshua): Add parent handlers to this list.

    const eventHandlerList = this._getHandlers(evt);

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
}