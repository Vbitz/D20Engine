import * as Core from 'core';

export type Bag<T> = {
  [s: string]: T
};

export function expect(): never {
  throw new Error('Expect Called');
}

/**
 * Returns a random number between 0 and 1 inclusive. Like `Math.random()`
 */
export type RandomFunction = () => number;