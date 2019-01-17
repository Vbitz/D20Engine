// TODO(joshua): For prototyping this is going to stay in 1 file but I should be
// split once that's done.
import * as Core from '.';

// tslint:disable-next-line:no-any
type Event = any;

// I want to be able to force a serializable value here. The issue with `any` is
// that it disables type checking.

// tslint:disable-next-line:no-any
type EventArgumentType = any;
// tslint:disable-next-line:no-any
type EventReturnType = any;

type GenericFunction = (...args: EventArgumentType[]) => EventReturnType;

// Based on:
// https://stackoverflow.com/questions/51851677/how-to-get-argument-types-from-function-in-typescript
type EventArgs<T extends Function> = T extends(...args: infer A) =>
                                                  EventReturnType ? A : never;


type EventReturnValue<T extends GenericFunction> =
    ReturnType<T>|EventCancel<ReturnType<T>>|undefined;

type EventPublicReturnValue<T extends GenericFunction> =
    ReturnType<T>|undefined;

type HandlerCallback<T extends GenericFunction> =
    (ctx: Context, ...args: EventArgs<T>) => Promise<EventReturnValue<T>>;

class Action<T extends GenericFunction> {
  constructor(
      private ctx: Context,
      private dispatch: () => Promise<EventPublicReturnValue<T>>) {}

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

class EventHandler {
  private handlerList: Map<string, EventHandlerList> = new Map();

  protected _registerHandler<T extends GenericFunction>(
      evt: T, cb: HandlerCallback<T>) {
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

  protected _callEvent<T extends GenericFunction>(
      ctx: Context, evt: T, ...args: EventArgs<T>): Action<T> {
    return new Action(ctx, () => {
      return this.callInternal(ctx, evt, args);
    });
  }

  private async callInternal<T extends GenericFunction>(
      ctx: Context, evt: T,
      args: EventArgs<T>): Promise<EventPublicReturnValue<T>> {
    if (typeof (evt) !== 'string') {
      throw new TypeError('evt should be a string');
    }

    // Validated using a runtime check.
    const evtName = evt as string;

    if (!this.handlerList.has(evtName)) {
      return undefined;
    }

    return this.handlerList.get(evtName)!.call(ctx, args);
  }
}

class Context extends EventHandler {
  constructor(private game: Game) {
    super();
  }

  /**
   *
   * @param evt
   * @param cb
   */
  registerGlobalHandler<T extends GenericFunction>(
      evt: T, cb: HandlerCallback<T>) {
    this._registerHandler(evt, cb);
  }

  /**
   *
   * @param evt
   * @param cb
   */
  registerHandler<T extends GenericFunction>(
      ent: Entity, evt: T, cb: HandlerCallback<T>) {
    ent.registerHandler(evt, cb);
  }

  /**
   *
   * @param evt
   * @param args
   */
  callEvent<T extends GenericFunction>(
      ent: Entity, evt: T, ...args: EventArgs<T>): Action<T> {
    const globalEventResult = this._callEvent(this, evt, ...args);

    // TODO(joshua): If this isn't canceled then call the event handler.

    return globalEventResult;
  }

  createEntity() {
    return new Entity();
  }

  cancel<T extends EventReturnType>(value: T) {
    return new EventCancel(value);
  }
}

class Entity extends EventHandler {
  registerHandler<T extends GenericFunction>(evt: T, cb: HandlerCallback<T>) {
    this._registerHandler(evt, cb);
  }
}

abstract class Module {
  abstract async onCreate(ctx: Context): Promise<void>;
}

class Game {
  private context = new Context(this);

  async registerModule(mod: Module) {
    await mod.onCreate(this.context);
  }
}

// Event Description.
const diceRollEvent: (args: {hello: 'world'}) => number =
    'core.diceRollEvent' as Event;

class DiceRollModule extends Module {
  async onCreate(ctx: Context) {
    ctx.registerGlobalHandler(diceRollEvent, async (ctx, args) => {
      console.log('[GLOBAL] Hello, World', args.hello);
      return 0;
    });

    const entity = ctx.createEntity();

    ctx.registerHandler(entity, diceRollEvent, async (ctx, args) => {
      console.log('[ENT] Hello, World', args.hello);
      return 1;
    });

    const a =
        await ctx.callEvent(entity, diceRollEvent, {hello: 'world'}).call();

    console.log(a);
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