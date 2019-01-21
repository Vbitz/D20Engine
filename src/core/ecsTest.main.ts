import * as Core from 'core';

// Event Description.
const diceRollEvent: (args: {hello: 'world'|'test'}) => number =
    'core.diceRollEvent' as Core.Event.EventDeclaration;

class DiceRollModule extends Core.Module {
  async onCreate(ctx: Core.Context) {
    ctx.registerGlobalHandler(diceRollEvent, async (ctx, args) => {
      console.log('[GLOBAL] Hello, World', args.hello);

      if (args.hello === 'world') {
        return ctx.cancel(10);
      }

      return 0;
    });

    const entity = ctx.createEntity();

    ctx.registerEntityHandler(entity, diceRollEvent, async (ctx, args) => {
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

export async function ecsTestMain(args: string[]) {
  const game = new Core.Game();

  await game.registerModule(new DiceRollModule());

  return 0;
}
