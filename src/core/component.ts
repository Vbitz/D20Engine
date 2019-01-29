import 'reflect-metadata';

import * as Core from 'core';

export enum PublicFieldType {
  String,
  Boolean,
  Number
}

export interface PublicFieldDescription {
  type: PublicFieldType;
}

interface ComponentPublicFields {
  __publicFields?: Map<string, PublicFieldDescription>;
}

type SerializableFieldNames<T> = {
  [K in keyof T]: T[K] extends Core.Value ? K : never
}[keyof T];

// Get all fields that derive from Core.Value (can be serialized).
type SerializableFields<T> = Pick<T, SerializableFieldNames<T>>;

// Flag all component fields as optional.
type ComponentFields<T> = {
  [s in keyof T]?: T[s]
};


function getTypeFromConstructor(
    type: NumberConstructor|StringConstructor|BooleanConstructor) {
  if (type === Number) {
    return PublicFieldType.Number;
  } else if (type === String) {
    return PublicFieldType.String;
  } else if (type === Boolean) {
    return PublicFieldType.Boolean;
  } else {
    throw new Error('Unknown publicField type');
  }
}

export function publicField<T extends ComponentParameters>(
    target: T, propertyKey: string) {
  // target is a lie and doesn't really exist.
  const type = getTypeFromConstructor(
      Reflect.getMetadata('design:type', target, propertyKey));

  const fieldsObject = (target.constructor as ComponentPublicFields);

  if (fieldsObject.__publicFields === undefined) {
    fieldsObject.__publicFields = new Map();
  }

  fieldsObject.__publicFields.set(propertyKey, {type});
}

export class ComponentParameters {
  getPublicFields() {
    const fieldsObject = (this.constructor as ComponentPublicFields);

    if (fieldsObject.__publicFields !== undefined) {
      return [...fieldsObject.__publicFields.entries()];
    } else {
      return [];
    }
  }
}

export abstract class Component<T extends ComponentParameters> extends
    Core.AbstractEventController {
  private owner: Core.Entity|undefined = undefined;

  constructor(readonly parameters: T) {
    super();
  }

  /**
   * Warning: Do not look at implementation. Contains mad science.
   * @param obj
   */
  load(obj: ComponentFields<SerializableFields<T>>): this {
    for (const key of Object.keys(obj) as Array<keyof SerializableFields<T>>) {
      this.parameters[key] = (obj as SerializableFields<T>)[key];
    }

    return this;
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
}