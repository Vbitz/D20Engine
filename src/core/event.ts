import * as Core from 'core';

export class Event<T extends EventSignature> {
  readonly callback?: T;

  readonly id: string|symbol;

  constructor(name?: string) {
    if (name !== undefined) {
      this.id = name;
    } else {
      this.id = Symbol();
    }
  }
}

export type EventDeclaration = Event<Core.EventSignature>;

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

export type GetEventSignature<T extends EventDeclaration> =
    Exclude<T['callback'], undefined>;

/**
 *
 * Based on:
 * https://stackoverflow.com/questions/51851677/how-to-get-argument-types-from-function-in-typescript
 */
type EventArgsInternal<T extends Function> = T extends(...args: infer A) =>
                                                          EventReturnType ?
    A :
    never;

export type EventArgs<T extends EventDeclaration> =
    EventArgsInternal<GetEventSignature<T>>;


type EventReturnValueInternal<T extends EventSignature> =
    ReturnType<T>|EventCancel<ReturnType<T>>|undefined;

export type EventReturnValue<T extends EventDeclaration> =
    EventReturnValueInternal<GetEventSignature<T>>;

type EventPublicReturnValueInternal<T extends EventSignature> =
    ReturnType<T>|undefined;

export type EventPublicReturnValue<T extends EventDeclaration> =
    EventPublicReturnValueInternal<GetEventSignature<T>>;

export type NonNullableEventReturnValue<T extends EventDeclaration> =
    ReturnType<GetEventSignature<T>>;

/**
 *
 */
export type HandlerCallback<T extends EventDeclaration> =
    (ctx: Core.Context, ...args: EventArgs<T>) => Promise<EventReturnValue<T>>;

export class EventCancel<T extends EventReturnType> {
  constructor(readonly value: T) {}
}

// It's assumed that validation happens in user code.
class EventHandlerList {
  id = Symbol();

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
export class EventControllerImpl implements Core.EventController {
  private handlerList: Map<string|symbol, EventHandlerList> = new Map();

  /**
   * Register a new handler for an event.
   * @param evt The event to attach a handler to.
   * @param cb The callback for the handler.
   */
  _registerHandler<T extends EventDeclaration>(evt: T, cb: HandlerCallback<T>) {
    // TODO(joshua): Should this support filters and priorities.
    const evtName = evt.id;

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
  _getHandlers<T extends EventDeclaration>(evt: T) {
    // Validated using a runtime check.
    const evtName = evt.id;

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
  _callHandlers<T extends EventDeclaration>(
      ctx: Core.Context, evt: T, handlers: Array<HandlerCallback<T>>,
      args: EventArgs<T>): Core.Action<T> {
    // TODO(joshua): Create HandlerContext

    return new Core.Action(ctx, async () => {
      return await this._callHandlersInternal(ctx, handlers, args);
    });
  }

  generateGraph(entityId: string|symbol, graphInterface: Core.GraphInterface) {
    for (const [key, marshal] of this.handlerList) {
      graphInterface.addNode(
          marshal.id, typeof (key) === 'symbol' ? undefined : key);
      graphInterface.addEdge(entityId, marshal.id);
    }
  }

  private async _callHandlersInternal<T extends EventDeclaration>(
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