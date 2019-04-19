import * as Core from '.';
import {ComponentPrivate} from './component';
import {EntityPrivate} from './entity';

export class Context {
  private _entityPrivate: WeakMap<Core.Entity, EntityPrivate> = new WeakMap();
  private _componentPrivate: WeakMap<Core.AnyComponent, ComponentPrivate> =
      new WeakMap();

  constructor(private _owner: Core.Game, private _parent: Context) {}

  // tslint:disable-next-line: no-any
  async addComponent(ent: Core.Entity, comp: Core.Component<any>) {
    this._getEntity(ent).addComponent(comp);

    await comp.onCreate(this);
  }

  createEntity(): Core.Entity {
    return Core.Entity.create(this);
  }

  registerEntity(ent: Core.Entity, privateData: EntityPrivate) {
    this._entityPrivate.set(ent, privateData);
  }

  registerComponent(comp: Core.AnyComponent, privateData: ComponentPrivate) {
    this._componentPrivate.set(comp, privateData);
  }

  private _getEntity(ent: Core.Entity): EntityPrivate {
    const entPrivate = this._entityPrivate.get(ent);

    if (entPrivate === undefined) {
      throw new Error('This context doesn\'t own the entity.');
    }

    return entPrivate;
  }

  private _getComponent(comp: Core.AnyComponent): ComponentPrivate {
    const entPrivate = this._componentPrivate.get(comp);

    if (entPrivate === undefined) {
      throw new Error('This context doesn\'t own the component.');
    }

    return entPrivate;
  }
}