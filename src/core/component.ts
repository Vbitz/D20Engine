import 'reflect-metadata';

import * as Core from 'core';

import {ComponentSpecification as ObjectSpecification, PublicFieldDescription, PublicFieldType} from './frontendCommon/renderer';

export interface ObjectPublicFields {
  __publicFields?: Map<string, PublicFieldDescription>;
}

export type SerializableFieldNames<T> = {
  [K in keyof T]: T[K] extends Core.Value ? K : never
}[keyof T];

// Get all fields that derive from Core.Value (can be serialized).
export type SerializableFields<T> = Pick<T, SerializableFieldNames<T>>;

interface DiceResultsConstructor {
  new(): Core.DiceResults;
}

function getTypeFromConstructor(
    type:
        NumberConstructor|StringConstructor|BooleanConstructor|DiceResultsConstructor) {
  if (type === Number) {
    return PublicFieldType.Number;
  } else if (type === String) {
    return PublicFieldType.String;
  } else if (type === Boolean) {
    return PublicFieldType.Boolean;
  } else if (type === Core.DiceResults) {
    return PublicFieldType.DiceResults;
  } else {
    console.warn('Unknown publicField type', type);

    return PublicFieldType.Unknown;
  }
}

function attachField<T extends StatefulObject>(
    target: T, key: string, type: PublicFieldDescription) {
  const fieldsObject = (target.constructor as ObjectPublicFields);

  if (fieldsObject.__publicFields === undefined) {
    fieldsObject.__publicFields = new Map();
  }

  fieldsObject.__publicFields.set(key, type);
}

// TODO(joshua): This should support better documentation.
export function publicField<T extends StatefulObject>(
    target: T, propertyKey: string) {
  // target is a lie and doesn't really exist.
  const type = getTypeFromConstructor(
      Reflect.getMetadata('design:type', target, propertyKey));

  attachField(target, propertyKey, {type});
}

// I'm not sure if enums have a type that can be generalized.
// tslint:disable-next-line:no-any
type EnumDeclaration = any;

/**
 * Enums need to have explicit values and not be const.
 * ```typescript
 * enum TestEnum {
 *  hello = "world"
 * }
 * ```
 * @param enumDeclaration
 */
export function publicEnumField(enumDeclaration: EnumDeclaration) {
  return function t<T extends StatefulObject>(target: T, propertyKey: string) {
    attachField(
        target, propertyKey,
        {type: PublicFieldType.Enum, members: enumDeclaration});
  };
}

export function publicDiceRollField<T extends StatefulObject>(
    target: T, propertyKey: string) {
  // target is a lie and doesn't really exist.
  const type = getTypeFromConstructor(
      Reflect.getMetadata('design:type', target, propertyKey));

  if (type !== PublicFieldType.String) {
    throw new Error('Not Implemented');
  }

  attachField(target, propertyKey, {type: PublicFieldType.DiceRoll});
}

export class StatefulObject {
  private __statefulObjectTag = 0;

  getPublicFields() {
    const fieldsObject = (this.constructor as ObjectPublicFields);

    if (fieldsObject.__publicFields !== undefined) {
      return [...fieldsObject.__publicFields.entries()].map(([name, type]) => {
        return {name, type};
      });
    } else {
      return [];
    }
  }

  getRendererSpecification(): ObjectSpecification {
    return {name: this.constructor.name, fields: this.getPublicFields()};
  }
}

/**
 * Components are stateless objects that contain the business logic for
 * ComponentParameters. Components can morph the state of ComponentParameters
 * though calls to setState.
 */
export abstract class Component<T extends StatefulObject> extends
    Core.AbstractEventController {
  readonly uuid = Core.Common.createUUID();

  private owner: Core.Entity|undefined = undefined;

  constructor(private _state: T) {
    super();
  }

  // TODO(joshua): No hacking allowed this will freeze parameters in the future.
  // Looks like adding that will require using a proxy.
  get state(): Readonly<SerializableFields<T>> {
    return this._state as unknown as Readonly<SerializableFields<T>>;
  }

  /**
   * Generally speaking you only want to call this to initialize an object.
   * Access may change in the future so don't rely on this as an easy
   * replacement to setState.
   * @param obj The set of fields to load for this component.
   */
  load(obj: Partial<SerializableFields<T>>): this {
    for (const key of Object.keys(obj) as Array<keyof SerializableFields<T>>) {
      this._state[key] = (obj as SerializableFields<T>)[key];
    }

    return this;
  }

  /**
   * Morphs the state of this component. This is an asynchronous function that
   * requires a valid content due to the future implementation plan for
   * serialization and time travel.
   * @param ctx The content being used to modify this component.
   * @param obj The set of fields to load for this component.
   */
  async setState(ctx: Core.Context, obj: Partial<SerializableFields<T>>):
      Promise<this> {
    for (const key of Object.keys(obj) as Array<keyof SerializableFields<T>>) {
      this._state[key] = (obj as SerializableFields<T>)[key];
    }

    return this;
  }

  /**
   * Warning this method should normally be called from a Context as some
   * registration may not happen.
   * @param evt
   * @param cb The callback to be executed for the handler.
   */
  registerHandler<T extends Core.EventDeclaration>(
      evt: T, cb: Core.HandlerCallback<T>) {
    this._registerHandler(evt, cb);
  }

  /**
   * Get a list of the handlers on this entity. This is only public to be used
   * by `Context`.
   * @param evt The event to get handlers for.
   */
  getHandlers<T extends Core.EventDeclaration>(evt: T) {
    return this._getHandlers(evt);
  }

  async executeRPC(
      ctx: Core.Context, rpcCtx: Core.RPC.Context,
      chain: Core.Value[]): Promise<void> {
    return await this._executeRPC(ctx, rpcCtx, chain);
  }

  addRPCMarshal(
      name: string, helpText: string,
      marshalCallback: Core.RPC.MarshalCallback) {
    return this._addRPCMarshal(name, helpText, marshalCallback);
  }

  addRPCAlias(name: string, helpText: string, alias: string[]) {
    this.addRPCMarshal(name, helpText, async (ctx, rpcCtx, chain) => {
      return await rpcCtx.chainRPC(
          // tslint:disable-next-line:no-any
          ctx, this as any as Core.Component<Core.StatefulObject>,
          [...alias, ...chain]);
    });
  }

  hasRPCMarshal(chain: Core.Value[]) {
    return this._hasRPCMarshal(chain);
  }

  setOwner(owner: Core.Entity) {
    this.owner = owner;
  }

  generateGraph(graphInterface: Core.GraphInterface) {
    graphInterface.addNode(this.uuid, 'Component');
    this._generateGraph(this.uuid, graphInterface);

    return this.uuid;
  }

  abstract async onCreate(ctx: Core.Context): Promise<void>;
}