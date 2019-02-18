import * as Core from 'core';

/**
 *
 */
export class Action<T extends Core.EventDeclaration> {
  constructor(
      private ctx: Core.Context,
      private dispatch: () => Promise<Core.EventPublicReturnValue<T>>) {}

  addPatch<T extends Core.EventDeclaration>(ev: T, cb: Core.HandlerCallback<T>):
      this {
    this.ctx.addPatch(ev, cb);
    return this;
  }

  /**
   *
   */
  call(): Promise<Core.EventPublicReturnValue<T>> {
    return this.dispatch();
  }
}