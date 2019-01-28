import * as Core from 'core';

export interface ComponentParameters {}

export abstract class Component<T extends ComponentParameters> extends
    Core.AbstractEventController {
  private owner: Core.Entity|undefined = undefined;

  constructor(readonly parameters: T) {
    super();
  }

  /**
   * Warning this method should normally be called from a Context as some
   * registration may not happen.
   * @param evt
   * @param cb The callback to be executed for the handler.
   */
  registerHandler<T extends Core.EventSignature>(
      evt: T, cb: Core.HandlerCallback<T>) {
    this._registerHandler(evt, cb);
  }

  /**
   * Get a list of the handlers on this entity. This is only public to be used
   * by `Context`.
   * @param evt The event to get handlers for.
   */
  getHandlers<T extends Core.EventSignature>(evt: T) {
    return this._getHandlers(evt);
  }

  setOwner(owner: Core.Entity) {
    this.owner = owner;
  }

  abstract async onCreate(ctx: Core.Context): Promise<void>;

  // TODO(joshua): Implement Component.template. I'm not happy with the
  // interface yet.
  // static create<T extends ComponentParams, C extends
  // Component<T>>(params: T):
  //     () => C {
  //   return () => {
  //     return new Component(Core.Common.copyValue(params));
  //   };
  // }
}