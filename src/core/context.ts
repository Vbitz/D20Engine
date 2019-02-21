import * as Core from 'core';

// It may be cool to allow explicit creation of context scopes. This could be
// useful for adding patches in a cleaner way.

export class Context extends Core.AbstractEventController {
  readonly uuid = Core.Common.createUUID();

  private children = new Set<Context>();

  constructor(private game: Core.Game, private parent: Core.Context|null) {
    super();
  }

  get entity(): Core.Entity {
    return this._getEntity();
  }

  get diceGenerator(): Core.Dice.DiceGenerator {
    return this.game.diceGenerator;
  }

  /**
   * Register a patch handler on this context. This will override handlers on
   * individual entities.
   * @param evt The event to attach a handler to.
   * @param cb The callback for the handler.
   */
  addPatch<T extends Core.EventDeclaration>(
      evt: T, cb: Core.HandlerCallback<T>) {
    this._registerHandler(evt, cb);
  }

  /**
   * Register a root handler. This is attached to the game instance and will be
   * called last in the event chain.
   * @param evt The event to attach a handler to.
   * @param cb The callback for the handler.
   */
  registerRootHandler<T extends Core.EventDeclaration>(
      evt: T, cb: Core.HandlerCallback<T>) {
    this.game.registerHandler(evt, cb);
  }

  /**
   * Register a handler on a specific entity. This should be used instead of
   * `Entity.registerHandler` as future changes may introduce additional
   * registration steps.
   * @param evt The event to attach a handler to.
   * @param cb The callback for the handler.
   */
  registerEntityHandler<T extends Core.EventDeclaration>(
      ent: Core.Entity, evt: T, cb: Core.HandlerCallback<T>) {
    ent.registerHandler(evt, cb);
  }

  /**
   * Register a handler on a specific component. This should be used instead of
   * `Component.registerHandler` as future changes may introduce additional
   * registration steps.
   * @param evt The event to attach a handler to.
   * @param cb The callback for the handler.
   */
  registerComponentHandler<Params extends Core.ComponentParameters,
                                          T extends Core.EventDeclaration>(
      comp: Core.Component<Params>, evt: T, cb: Core.HandlerCallback<T>) {
    comp.registerHandler(evt, cb);
  }

  /**
   * Call an event on an entity.
   * @param ent The entity to use as the context to call the event with.
   * @param evt The event to call.
   * @param args A list of arguments to call the event with.
   */
  callEvent<T extends Core.EventDeclaration>(
      ent: Core.Entity, evt: T, ...args: Core.EventArgs<T>): Core.Action<T> {
    // TODO(joshua): Add parent handlers to this list.

    let eventHandlerList: Array<Core.HandlerCallback<T>> = [];

    if (this.parent !== null) {
      eventHandlerList = eventHandlerList.concat(this.parent._getHandlers(evt));
    }

    eventHandlerList = eventHandlerList.concat(this._getHandlers(evt));

    eventHandlerList = eventHandlerList.concat(ent.getHandlers(evt));

    const ctx = this.getEntityContext(ent);

    const eventResult = this._callHandlers(ctx, evt, eventHandlerList, args);

    return eventResult;
  }

  /**
   * Call a root event.
   * @param evt The event to call.
   * @param args A list of arguments to call the event with.
   */
  callRootEvent<T extends Core.EventDeclaration>(
      evt: T, ...args: Core.EventArgs<T>): Core.Action<T> {
    // TODO(joshua): Add parent handlers to this list.

    const rootContext = this.getRootEventContext();

    const eventHandlerList = this.game.getHandlers(evt);

    const eventResult =
        this._callHandlers(rootContext, evt, eventHandlerList, args);

    return eventResult;
  }

  createEntity() {
    /**
     * TODO(joshua): Expand this method.
     */
    return this.game.createEntity(this);
  }

  addChildContext(ctx: Context) {
    this.children.add(ctx);
  }

  /**
   * Cancel a handler by returning this value.
   * @param value The value to return from the event.
   */
  cancel<T extends Core.EventReturnType>(value: T) {
    return new Core.EventCancel(value);
  }

  protected _getEntity(): Core.Entity {
    throw new Error('Not Implemented');
  }

  private getRootEventContext(): Core.Context {
    return this;
  }

  private getEntityContext(ent: Core.Entity): Core.Context {
    const newContext = new EntityContext(this.game, this, ent);

    this.addChildContext(newContext);

    return newContext;
  }
}

export class ModuleContext extends Context {}

export class EntityContext extends Context {
  constructor(
      game: Core.Game, parent: Core.Context, private _entity: Core.Entity) {
    super(game, parent);
  }

  protected _getEntity() {
    return this._entity;
  }
}