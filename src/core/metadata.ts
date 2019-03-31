import * as Core from 'core';

interface BaseObjectField {}

export interface BasicField extends BaseObjectField {
  type: 'string'|'number'|'boolean';
}

export interface StatefulObjectField extends BaseObjectField {
  type: 'object';

  sourceFilename: string;

  name: string;
}

export interface DiceSpecificationField extends BaseObjectField {
  type: 'diceSpecification';
}

export interface DiceResultField extends BaseObjectField {
  type: 'diceResult';
}

export interface EnumField extends BaseObjectField {
  type: 'enum';

  name: string;

  values: Core.Common.Bag<string>;
}

export interface ArrayField extends BaseObjectField {
  type: 'array';

  valueType: ObjectField;
}

export interface NullableField extends BaseObjectField {
  type: 'nullable';

  valueType: ObjectField;
}

export type ObjectField =
    BasicField|StatefulObjectField|DiceSpecificationField|DiceResultField|EnumField|ArrayField|NullableField;

/**
 * The StatefulObject's constructor is casted to this type to add the metadata
 * as a static field.
 */
export interface StatefulObjectMetadata {
  __name?: string;
  __fields?: StatefulObjectFields;
}

export type StatefulObjectFields = Core.Common.Bag<ObjectField>;

export interface StatefulObjectConstructor {
  new(): Core.StatefulObject;
}