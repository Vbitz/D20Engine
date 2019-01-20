import * as Core from 'core';

export interface GameLike {
  readonly game: Core.Game;
}

type PrimitiveValue = string|boolean|number|null|undefined;

type NonNullablePrimitive = string|boolean|number;

interface JSONObject<T> {
  [s: string]: T|JSONObject<T>|Array<JSONObject<T>>;
}

export type NonNullableValue =
    JSONObject<NonNullablePrimitive>|NonNullablePrimitive;

export type Value = JSONObject<PrimitiveValue>|PrimitiveValue;

export interface EventController {
  _registerHandler<T extends Core.EventSignature>(
      evt: T, cb: Core.HandlerCallback<T>): void;

  _getHandlers<T extends Core.EventSignature>(evt: T):
      Array<Core.HandlerCallback<T>>;

  _callHandlers<T extends Core.EventSignature>(
      ctx: Core.Context, evt: T, handlers: Array<Core.HandlerCallback<T>>,
      args: Core.Event.EventArgs<T>): Core.Action<T>;
}

export class AbstractEventController {
  private eventController = new Core.Event.EventControllerImpl();

  /**
   * Register a new handler for an event.
   * @param evt The event to attach a handler to.
   * @param cb The callback for the handler.
   */
  protected _registerHandler<T extends Core.EventSignature>(
      evt: T, cb: Core.HandlerCallback<T>): void {
    this.eventController._registerHandler(evt, cb);
  }

  /**
   * Get all handlers for `evt`. Returns an empty array if no handlers are
   * registered.
   * @param evt The event to get handlers for.
   */
  protected _getHandlers<T extends Core.EventSignature>(evt: T):
      Array<Core.HandlerCallback<T>> {
    return this.eventController._getHandlers(evt);
  }

  /**
   * This method is technically safe to call with handlers from other instances
   * of `EventController`. This method may become static in the future.
   * @param ctx The context to execute the call with.
   * @param evt Only used for type checking of arguments.
   * @param handlers The list of handlers to try calling.
   * @param args The array of arguments to call the event with.
   */
  protected _callHandlers<T extends Core.EventSignature>(
      ctx: Core.Context, evt: T, handlers: Array<Core.HandlerCallback<T>>,
      args: Core.Event.EventArgs<T>): Core.Action<T> {
    return this.eventController._callHandlers(ctx, evt, handlers, args);
  }
}