import * as Core from 'core';
import * as PF from 'd20/pf';
import * as Game from 'libgame';

export class CharacterGeneratorArguments extends Core.StatefulObject {
  constructor() {
    super();
  }
}

export class CharacterGeneratorState extends Core.StatefulObject {
  constructor() {
    super();
  }
}

export class CharacterGeneratorModule extends Core.Module {
  async onCreate(ctx: Core.Context) {}
}

export class CharacterGeneratorInteraction extends Core.Interaction {}

export class CharacterGenerator extends
    Core.Component<CharacterGeneratorState> {
  static State = CharacterGeneratorState;
  static Module = CharacterGeneratorModule;

  static GenerateArguments = CharacterGeneratorArguments;
  static GenerateInteraction = CharacterGeneratorInteraction;

  // Method Declarations
  static generate =
      new Core.Event<(args: CharacterGeneratorArguments) => void>();

  constructor() {
    super(new CharacterGeneratorState());
  }

  async onCreate(ctx: Core.Context) {
    ctx.registerComponentHandler(
        this, CharacterGenerator.generate, this.generate.bind(this));
  }

  async generate(ctx: Core.Context) {
    // All the communication for these steps happens in private messages.

    // Use an interaction to welcome the new player to character generation and
    // layout the rough sequence of steps. This whole component is interacted
    // with using an interaction with a series of nested commands.

    await ctx.entity.addComponent(ctx, new PF.Components.StatisticsBlock());

    await ctx.callEvent(ctx.entity, PF.Components.StatisticsBlock.roll);

    // Show the player the stats and offer rerolls or swapping of values.
    // (STR -> INT)

    await ctx.entity.addComponent(ctx, new PF.Components.Creature());

    await ctx.entity.addComponent(ctx, new PF.Components.Player());

    // Have the player select an ancestry using PF.Registry.AncestryRegistry

    // Have the player select a class using PF.Registry.ClassRegistry

    // Look up ancestry bonuses and apply then questioning the player when
    // needed.

    // Look up class bonuses and apply them using the same approach as for
    // ancestry.

    // Have the player select a number of skills.

    // Have the player select a number of feats.

    // If the player is a magic user have them select spells.

    // Have the player select starting items using the calculated amount of
    // wealth.

    // Have the player select alignment.

    // The player can finalize once all steps are completed.
  }
}