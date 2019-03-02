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

export class CharacterGeneratorInteraction extends Core.Interaction {
  constructor(
      private entity: Core.Entity, private generator: CharacterGenerator) {
    super();
  }

  startStage1() {
    this.addMarshal(
        'ancestry', 'Select a Player Ancestry for the new Character',
        this.selectAncestry.bind(this));

    this.addMarshal(
        'class', 'Select a Player Class for the new Character',
        this.selectClass.bind(this));

    // TODO(joshua): Add alias for `race` to `ancestry`.
  }

  startStage2() {
    this.addMarshal(
        'addSkill', 'Add a skill to the new Character',
        this.addSkill.bind(this));

    this.addMarshal(
        'addFeat', 'Add a feat to the new Character', this.addFeat.bind(this));

    // TODO(joshua): Figure out if the character has a spell-casting component
    // before adding this command.
    this.addMarshal(
        'addSpell', 'Add a spell to the new Character',
        this.addSpell.bind(this));
  }

  private async selectAncestry(
      ctx: Core.Context, rpcCtx: Core.RPC.Context, chain: Core.Value[]) {
    // Have the player select an ancestry using PF.Registry.AncestryRegistry

    // Look up ancestry bonuses and apply then questioning the player when
    // needed.
  }

  private async selectClass(
      ctx: Core.Context, rpcCtx: Core.RPC.Context, chain: Core.Value[]) {
    // Have the player select a class using PF.Registry.ClassRegistry

    // Look up class bonuses and apply them using the same approach as for
    // ancestry.
  }

  private async addSkill(
      ctx: Core.Context, rpcCtx: Core.RPC.Context, chain: Core.Value[]) {
    // Have the player select a number of skills.
  }

  private async addFeat(
      ctx: Core.Context, rpcCtx: Core.RPC.Context, chain: Core.Value[]) {
    // Have the player select a number of feats.
  }

  private async addSpell(
      ctx: Core.Context, rpcCtx: Core.RPC.Context, chain: Core.Value[]) {
    // If the player is a magic user have them select spells.
  }

  private async addItem(
      ctx: Core.Context, rpcCtx: Core.RPC.Context, chain: Core.Value[]) {
    // Have the player select starting items using the calculated amount of
    // wealth.
  }
}

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

    // Use an interaction to welcome the new player to character generation
    // and layout the rough sequence of steps. This whole component is
    // interacted with using an interaction with a series of nested commands.

    await ctx.entity.addComponent(ctx, new PF.Components.StatisticsBlock());

    await ctx.callEvent(ctx.entity, PF.Components.StatisticsBlock.roll);

    // Show the player the stats and offer rerolls or swapping of values.
    // (STR -> INT)

    await ctx.entity.addComponent(ctx, new PF.Components.Creature());

    await ctx.entity.addComponent(ctx, new PF.Components.Player());

    // Once stats are rolled all of the other steps can be completed in pretty
    // much any order. Some have dependencies though.

    const interaction = new CharacterGeneratorInteraction(ctx.entity, this);

    interaction.startStage1();

    // ctx.startInteraction(new CharacterGeneratorInteraction(ctx.entity, this))

    // Have the player select alignment.

    // Have the player select a character name.

    // The player can finalize once all steps are completed.

    // Once finalized add read-only or read-write character interface.
  }
}