import * as Core from '.';

export interface EntityPrivate {
  addComponent(comp: Core.AnyComponent): void;
}

export class Entity {
  private constructor(ctx: Core.Context) {
    ctx.registerEntity(this, {addComponent: this._addComponent.bind(this)});
  }

  private _components: Core.AnyComponent[] = [];

  private _addComponent(comp: Core.AnyComponent) {
    this._components.push(comp);
  }

  static create(ctx: Core.Context) {
    return new Entity(ctx);
  }
}