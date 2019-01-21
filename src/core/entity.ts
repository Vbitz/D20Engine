import * as Core from 'core';

export class Entity extends Core.AbstractEventController {
  private componentList: Array<Core.Component<Core.ComponentParameters>> = [];

  get components() {
    // Shallow copy the components array.
    return [...this.componentList];
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
    return this._getHandlers(evt).concat(
        ...this.componentList.map((comp) => comp.getHandlers(evt)));
  }

  async addComponent(
      ctx: Core.Context, comp: Core.Component<Core.ComponentParameters>) {
    this.componentList.push(comp);

    comp.setOwner(this);

    await comp.onCreate(ctx);
  }
}