import {Bag} from './common';

export enum PublicFieldType {
  String,
  Boolean,
  Number,
  Enum,
  DiceRoll,
  Unknown
}

export interface PublicBasicFieldDescription {
  type: PublicFieldType.String|PublicFieldType.Number|PublicFieldType
      .Boolean|PublicFieldType.Unknown;
}

export interface PublicEnumFieldDescription {
  type: PublicFieldType.Enum;

  members: Bag<string|number>;
}

export interface PublicDiceRollFieldDescription {
  type: PublicFieldType.DiceRoll;
}

export type PublicFieldDescription =
    PublicBasicFieldDescription|PublicEnumFieldDescription|PublicDiceRollFieldDescription;

export interface ComponentSpecification {
  name: string;
  fields: Array<{name: string, type: PublicFieldDescription}>;
}