import * as Core from 'core';

export interface GameLike {
  readonly game: Core.Game;
}

type PrimitiveValue = string|boolean|number|null|undefined;

type NonNullablePrimitive = string|boolean|number;

interface JSONObject<T> {
  [s: string]: T|JSONObject<T>|Array<JSONObject<T>>;
}

export type NonNullableValue =
    JSONObject<NonNullablePrimitive>|NonNullablePrimitive;

export type Value = JSONObject<PrimitiveValue>|PrimitiveValue;