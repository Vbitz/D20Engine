import * as Core from 'core';

// tslint:disable-next-line:no-any
export type EventDeclaration = any;

// I want to be able to force a serializable value here. The reason `any` works
// here is it disables type checking.

// tslint:disable-next-line:no-any
export type EventArgumentType = any;
// tslint:disable-next-line:no-any
export type EventReturnType = any;

/**
 *
 */
export type EventSignature = (...args: EventArgumentType[]) => EventReturnType;

/**
 *
 * Based on:
 * https://stackoverflow.com/questions/51851677/how-to-get-argument-types-from-function-in-typescript
 */
export type EventArgs<T extends Function> = T extends(...args: infer A) =>
                                                         EventReturnType ?
    A :
    never;


/**
 *
 */
export type EventReturnValue<T extends EventSignature> =
    ReturnType<T>|EventCancel<ReturnType<T>>|undefined;

/**
 *
 */
export type EventPublicReturnValue<T extends EventSignature> =
    ReturnType<T>|undefined;

/**
 *
 */
export type HandlerCallback<T extends EventSignature> =
    (ctx: Core.Context, ...args: EventArgs<T>) => Promise<EventReturnValue<T>>;

export class EventCancel<T extends EventReturnType> {
  constructor(readonly value: T) {}
}

// It's assumed that validation happens in user code.
class EventHandlerList {
  // tslint:disable-next-line:no-any
  private handlers: Array<HandlerCallback<any>> = [];

  // tslint:disable-next-line:no-any
  addHandler(handler: any) {
    this.handlers.push(handler);
  }

  getHandlers() {
    // Shallow copy the array structure.
    return [...this.handlers];
  }

  // tslint:disable-next-line:no-any
  async call(ctx: Core.Context, args: any[]):
      // tslint:disable-next-line:no-any
      Promise<EventPublicReturnValue<any>> {
    let ret = undefined;

    for (const handler of this.handlers) {
      ret = await handler(ctx, ...args);

      if (ret instanceof EventCancel) {
        return ret.value;
      }
    }

    return ret;
  }
}

/**
 * Core EventController. This implements the main interface for the event
 * system. Roughly speaking this is designed to implement a event system in 2
 * stages. The first stage collects all relevant callbacks from the object
 * hierarchy and then the second stage executes callbacks until one is canceled
 * or there are no more to execute.
 */
export class EventController {
  private handlerList: Map<string, EventHandlerList> = new Map();

  /**
   * Register a new handler for an event.
   * @param evt The event to attach a handler to.
   * @param cb The callback for the handler.
   */
  protected _registerHandler<T extends EventSignature>(
      evt: T, cb: HandlerCallback<T>) {
    // TODO(joshua): Should this support filters and priorities.

    if (typeof (evt) !== 'string') {
      throw new TypeError('evt should be a string');
    }

    // Validated using a runtime check.
    const evtName = evt as string;

    if (!this.handlerList.has(evtName)) {
      this.handlerList.set(evtName, new EventHandlerList());
    }

    this.handlerList.get(evtName)!.addHandler(cb);
  }

  /**
   * Get all handlers for `evt`. Returns an empty array if no handlers are
   * registered.
   * @param evt The event to get handlers for.
   */
  protected _getHandlers<T extends EventSignature>(evt: T) {
    if (typeof (evt) !== 'string') {
      throw new TypeError('evt should be a string');
    }

    // Validated using a runtime check.
    const evtName = evt as string;

    if (!this.handlerList.has(evtName)) {
      return [];
    }

    return this.handlerList.get(evtName)!.getHandlers();
  }

  /**
   * This method is technically safe to call with handlers from other instances
   * of `EventController`. This method may become static in the future.
   * @param ctx The context to execute the call with.
   * @param evt Only used for type checking of arguments.
   * @param handlers The list of handlers to try calling.
   * @param args The array of arguments to call the event with.
   */
  protected _callHandlers<T extends EventSignature>(
      ctx: Core.Context, evt: T, handlers: Array<HandlerCallback<T>>,
      args: EventArgs<T>): Core.Action<T> {
    // TODO(joshua): Create HandlerContext

    return new Core.Action(ctx, async () => {
      return await this._callHandlersInternal(ctx, handlers, args);
    });
  }

  private async _callHandlersInternal<T extends EventSignature>(
      ctx: Core.Context, handlers: Array<HandlerCallback<T>>,
      args: EventArgs<T>): Promise<EventPublicReturnValue<T>> {
    let ret: EventReturnValue<T> = undefined;

    for (const handler of handlers) {
      ret = await handler(ctx, ...args);

      // If the event should be canceled return that value directly.
      if (ret instanceof EventCancel) {
        return ret.value;
      }
    }

    return ret;
  }
}