import * as Core from 'core';
import {randomBytes} from 'crypto';

import {Bag, expect} from './frontendCommon/common';

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

export {Bag, expect};