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

  async callChecked(): Promise<Core.NonNullableEventReturnValue<T>> {
    const returnValue = await this.call();

    if (returnValue === undefined) {
      throw new Error('Action.callChecked failed');
    }

    return returnValue;
  }
}