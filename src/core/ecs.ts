// TODO(joshua): For prototyping this is going to stay in 1 file but I should be
// split once that's done.
import * as Core from '.';

// tslint:disable-next-line:no-any
type Event = any;

// I want to be able to force a serializable value here. The reason `any` works
// here is it disables type checking.

// tslint:disable-next-line:no-any
type EventArgumentType = any;
// tslint:disable-next-line:no-any
type EventReturnType = any;

/**
 *
 */
type EventSignature = (...args: EventArgumentType[]) => EventReturnType;

/**
 *
 * Based on:
 * https://stackoverflow.com/questions/51851677/how-to-get-argument-types-from-function-in-typescript
 */
type EventArgs<T extends Function> = T extends(...args: infer A) =>
                                                  EventReturnType ? A : never;


/**
 *
 */
type EventReturnValue<T extends EventSignature> =
    ReturnType<T>|EventCancel<ReturnType<T>>|undefined;

/**
 *
 */
type EventPublicReturnValue<T extends EventSignature> = ReturnType<T>|undefined;

/**
 *
 */
type HandlerCallback<T extends EventSignature> =
    (ctx: Context, ...args: EventArgs<T>) => Promise<EventReturnValue<T>>;

/**
 *
 */
class Action<T extends EventSignature> {
  constructor(
      private ctx: Context,
      private dispatch: () => Promise<EventPublicReturnValue<T>>) {}

  addPatch<T extends EventSignature>(ev: T, cb: HandlerCallback<T>) {
    throw new Error('Not Implemented');
  }

  /**
   *
   */
  call(): Promise<EventPublicReturnValue<T>> {
    return this.dispatch();
  }
}

class EventCancel<T extends EventReturnType> {
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
  async call(ctx: Context, args: any[]): Promise<EventPublicReturnValue<any>> {
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
class EventController {
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
      ctx: Context, evt: T, handlers: Array<HandlerCallback<T>>,
      args: EventArgs<T>): Action<T> {
    // TODO(joshua): Create HandlerContext

    return new Action(ctx, async () => {
      return await this._callHandlersInternal(ctx, handlers, args);
    });
  }

  private async _callHandlersInternal<T extends EventSignature>(
      ctx: Context, handlers: Array<HandlerCallback<T>>,
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

class Context extends EventController {
  constructor(private game: Game) {
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
  registerGlobalHandler<T extends EventSignature>(
      evt: T, cb: HandlerCallback<T>) {
    this._registerHandler(evt, cb);
  }

  /**
   * Register a handler on a specific entity. This should be used instead of
   * `Entity.registerHandler` as future changes may introduce additional
   * registration steps.
   * @param evt The event to attach a handler to.
   * @param cb The callback for the handler.
   */
  registerHandler<T extends EventSignature>(
      ent: Entity, evt: T, cb: HandlerCallback<T>) {
    ent.registerHandler(evt, cb);
  }

  /**
   * Call an event on an entity.
   * @param ent The entity to use as the context to call the event with.
   * @param evt The event to call.
   * @param args A list of arguments to call the event with.
   */
  callEvent<T extends EventSignature>(
      ent: Entity, evt: T, ...args: EventArgs<T>): Action<T> {
    // TODO(joshua): Add parent handlers to this list.

    let eventHandlerList = this._getHandlers(evt);

    eventHandlerList = eventHandlerList.concat(ent.getHandlers(evt));

    const eventResult = this._callHandlers(this, evt, eventHandlerList, args);

    return eventResult;
  }

  createEntity() {
    /**
     * TODO(joshua): Expand this method.
     */
    return new Entity();
  }

  /**
   * Cancel a handler by returning this value.
   * @param value The value to return from the event.
   */
  cancel<T extends EventReturnType>(value: T) {
    return new EventCancel(value);
  }
}

class Entity extends EventController {
  /**
   * Warning this method should normally be called from a Context as some
   * registration may not happen.
   * @param evt
   * @param cb The callback to be executed for the handler.
   */
  registerHandler<T extends EventSignature>(evt: T, cb: HandlerCallback<T>) {
    this._registerHandler(evt, cb);
  }

  /**
   * Get a list of the handlers on this entity. This is only public to be used
   * by `Context`.
   * @param evt The event to get handlers for.
   */
  getHandlers<T extends EventSignature>(evt: T) {
    return this._getHandlers(evt);
  }
}

abstract class Module {
  abstract async onCreate(ctx: Context): Promise<void>;
}

class Game {
  private context = new Context(this);

  /**
   * Register and initialize a module within this `Game` instance.
   * @param mod The module to register.
   */
  async registerModule(mod: Module) {
    await mod.onCreate(this.context);
  }
}

// Event Description.
const diceRollEvent: (args: {hello: 'world'|'test'}) => number =
    'core.diceRollEvent' as Event;

class DiceRollModule extends Module {
  async onCreate(ctx: Context) {
    ctx.registerGlobalHandler(diceRollEvent, async (ctx, args) => {
      console.log('[GLOBAL] Hello, World', args.hello);

      if (args.hello === 'world') {
        return ctx.cancel(10);
      }

      return 0;
    });

    const entity = ctx.createEntity();

    ctx.registerHandler(entity, diceRollEvent, async (ctx, args) => {
      console.log('[ENT] Hello, World', args.hello);

      return 1;
    });

    const a =
        await ctx.callEvent(entity, diceRollEvent, {hello: 'world'}).call();

    const b =
        await ctx.callEvent(entity, diceRollEvent, {hello: 'test'}).call();

    console.log(a, b);
  }
}

async function main(args: string[]) {
  const game = new Game();

  await game.registerModule(new DiceRollModule());

  return 0;
}

if (process.mainModule === module) {
  main(process.argv.slice(2))
      .then((exitCode) => process.exitCode = exitCode)
      .catch((err) => {
        console.error('Fatal', err);
        process.exit(1);
      });
}