# Event Component System POC/Prototype

```typescript
type GenericFunction = (...args: any[]) => any;

// Based on: https://stackoverflow.com/questions/51851677/how-to-get-argument-types-from-function-in-typescript
type EventArgs<T extends Function> = T extends (...args: infer A) => any ? A : never;

class Context {
  registerHandler<T extends GenericFunction>(evt: T, cb: (ctx: Context, ...args: EventArgs<T>) => Promise<ReturnType<T>>) {

  }
}

class Entity {
  callEvent<T extends GenericFunction>(evt: T, ...args: EventArgs<T>): Promise<ReturnType<T>> {
    return 0 as any;
  }
}

// Event Description.
const DiceRollEvent: (args: {hello: "world"}) => number = Symbol() as any;

class DiceRollModule {
  onCreate(ctx: Context) {
    ctx.registerHandler(DiceRollEvent, async (ctx, args) => {
      console.log("Hello, World", args.hello);
      return 2;
    });
  }

  async onCall(ent: Entity) {
    const a = await ent.callEvent(DiceRollEvent, { hello: "world" });
  }
}
```

The above code demonstrates a fully type safe completly infered event system
that decouples declaration from handler. This way I can declare an an event
anywhere in the code and call or add handlers to it. By using the slightly
nasty syntax of `Symbol()` types can be refered with just a symbol rather than
a string. This meens I don't need to create a miror project hirarchy for event
declarations and I can declare them inline.
