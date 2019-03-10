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

export interface ComponentSave {
  engineVersion: string;
  constructorId: string;
  state: StatefulObjectSave;
}

export interface StatefulObjectSave {
  constructorId: string;
  fields: Core.Common.Bag<Core.Value>;
}

export class StatefulObject {
  private __statefulObjectTag = 0;

  save(): StatefulObjectSave {
    const constructorId = '';
    const fields: Core.Common.Bag<Core.Value> = {};

    console.log(this.constructor);

    const fieldList = Core.Reflect.getFields(this.constructor);

    if (fieldList === undefined) {
      throw new Error(
          `Reflection metadata does not exist for: ${constructorId}`);
    }

    for (const [name, field] of Object.entries(fieldList)) {
      // tslint:disable-next-line: no-any
      fields[name] = this.serializeField((this as any)[name], field);
    }

    return {constructorId, fields};
  }

  load(saveObject: StatefulObjectSave) {
    // TODO(joshua): Assert that the constructorId is correct.

    console.log(this.constructor);

    const fieldList = Core.Reflect.getFields(this.constructor);

    if (fieldList === undefined) {
      throw new Error(`Reflection metadata does not exist for: ${
          saveObject.constructorId}`);
    }

    for (const [name, field] of Object.entries(fieldList)) {
      // tslint:disable-next-line: no-any
      (this as any)[name] =
          this.deserilizeField(saveObject.fields[name], field);
    }
  }

  private serializeField(
      // tslint:disable-next-line: no-any
      field: any, fieldDescription: Core.Metadata.ObjectField): Core.Value {
    if (fieldDescription.type === 'string') {
      if (typeof field !== 'string') {
        throw new Error(`Type mismatch on ${name}. Should be string.`);
      } else {
        return field;
      }
    } else if (fieldDescription.type === 'boolean') {
      if (typeof field !== 'boolean') {
        throw new Error(`Type mismatch on ${name}. Should be boolean.`);
      } else {
        return field;
      }
    } else if (fieldDescription.type === 'number') {
      if (typeof field !== 'number') {
        throw new Error(`Type mismatch on ${name}. Should be number.`);
      } else {
        return field;
      }
    } else if (fieldDescription.type === 'array') {
      throw new Error('Array Not Implemented');
    } else if (fieldDescription.type === 'diceResult') {
      if (!(field instanceof Core.DiceResults)) {
        throw new Error(`Type mismatch on ${name}. Should be DiceResult.`);
      } else {
        // TODO(joshua): Does this work?

        // tslint:disable-next-line: no-any
        return {value: field.value, rolledSpec: field.rolledSpec as any};
      }
    } else if (fieldDescription.type === 'diceSpecification') {
      if (!(field instanceof Core.DiceSpecification)) {
        throw new Error(
            `Type mismatch on ${name}. Should be DiceSpecification.`);
      } else {
        // TODO(joshua): Does this work?

        // tslint:disable-next-line: no-any
        return {node: field.node as any};
      }
    } else if (fieldDescription.type === 'nullable') {
      throw new Error('Nullable Not Implemented');
    } else if (fieldDescription.type === 'enum') {
      throw new Error('Enum Not Implemented');
    } else if (fieldDescription.type === 'object') {
      throw new Error('Object Not Implemented');
    } else {
      return Core.Common.assertNever(fieldDescription.type);
    }
  }

  private deserilizeField(
      // tslint:disable-next-line: no-any
      field: any, fieldDescription: Core.Metadata.ObjectField) {
    if (fieldDescription.type === 'string') {
      if (typeof field !== 'string') {
        throw new Error(`Type mismatch on ${name}. Should be string.`);
      } else {
        return field;
      }
    } else if (fieldDescription.type === 'boolean') {
      if (typeof field !== 'boolean') {
        throw new Error(`Type mismatch on ${name}. Should be boolean.`);
      } else {
        return field;
      }
    } else if (fieldDescription.type === 'number') {
      if (typeof field !== 'number') {
        throw new Error(`Type mismatch on ${name}. Should be number.`);
      } else {
        return field;
      }
    } else if (fieldDescription.type === 'array') {
      throw new Error('Array Not Implemented');
    } else if (fieldDescription.type === 'diceResult') {
      if (field.rolledSpec === undefined || field.value === undefined) {
        throw new Error(
            'Type mismatch. Could not find rolledSpec and value fields.');
      }

      return new Core.DiceResults(field.rolledSpec, field.value);
    } else if (fieldDescription.type === 'diceSpecification') {
      if (field.rolledSpec === undefined || field.value === undefined) {
        throw new Error(
            'Type mismatch. Could not find rolledSpec and value fields.');
      }

      return new Core.DiceResults(field.rolledSpec, field.value);
    } else if (fieldDescription.type === 'nullable') {
      throw new Error('Nullable Not Implemented');
    } else if (fieldDescription.type === 'enum') {
      throw new Error('Enum Not Implemented');
    } else if (fieldDescription.type === 'object') {
      throw new Error('Object Not Implemented');
    } else {
      return Core.Common.assertNever(fieldDescription.type);
    }
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