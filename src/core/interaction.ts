import * as Core from 'core';

export type InteractionInterface =
    (ctx: Core.Context, interaction: Interaction) => Promise<void>;

/**
 * Interactions are the core of how the user interface works. The simplest
 * explanation is they are an API for easily creating epidermal RPC providers.
 * The main goal at this stage is they provide a good user interface for Discord
 * and for bots and other automation. The public interface for these is through
 * contexts.
 *
 * Interactions should also be able to be nested.
 */
export class Interaction extends Core.RPC.ControllerImpl {
  // It should be safe to derive directly from Core.RPC.ControllerImpl but this
  // is not really how that class was originally intended.
}