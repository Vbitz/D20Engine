import * as Core from 'core';

/**
 *
 */
export class Action<T extends Core.EventSignature> {
  constructor(
      private ctx: Core.Context,
      private dispatch: () => Promise<Core.Event.EventPublicReturnValue<T>>) {}

  addPatch<T extends Core.EventSignature>(ev: T, cb: Core.HandlerCallback<T>) {
    throw new Error('Not Implemented');
  }

  /**
   *
   */
  call(): Promise<Core.Event.EventPublicReturnValue<T>> {
    return this.dispatch();
  }
}