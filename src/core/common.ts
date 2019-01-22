import * as Core from 'core';
import {randomBytes} from 'crypto';

export type Bag<T> = {
  [s: string]: T
};

export function expect(): never {
  throw new Error('Expect Called');
}

export function createUUID() {
  const randomString = randomBytes(8);

  const parts = [
    randomString.toString('hex', 0, 1), randomString.toString('hex', 2, 3),
    randomString.toString('hex', 4, 5), randomString.toString('hex', 6, 7)
  ];

  return parts.join(':');
}

/**
 * Returns a random number between 0 and 1 inclusive. Like `Math.random()`
 */
export type RandomFunction = () => number;