import * as Core from 'core';
import {createCipher, createHash, randomBytes} from 'crypto';
import {exists as _exists, mkdir as _mkdir, readFile as _readFile, writeFile as _writeFile} from 'fs';
import * as path from 'path';
import {promisify} from 'util';

const exists = promisify(_exists);
const mkdir = promisify(_mkdir);
const readFile = promisify(_readFile);
const writeFile = promisify(_writeFile);

import {Bag, expect} from './frontendCommon/common';

export function createUUID() {
  const randomString = randomBytes(8);

  const parts = [
    randomString.toString('hex', 0, 1), randomString.toString('hex', 2, 3),
    randomString.toString('hex', 4, 5), randomString.toString('hex', 6, 7)
  ];

  return parts.join(':');
}

export function hashString(str: string) {
  return createHash('SHA256').update(str).digest().toString('hex');
}

/**
 * Returns a random number between 0 and 1 inclusive. Like `Math.random()`
 */
export type RandomFunction = () => number;

export async function ensurePath(directoryPath: string): Promise<void> {
  if (await exists(directoryPath)) {
    return;
  } else {
    // Get the parent directory to this path.
    const parent = path.resolve(directoryPath, '..');

    // Ensure that the parent exists.
    await ensurePath(parent);

    await mkdir(directoryPath);
  }
}

export {Bag, expect, exists as fileExists, readFile, writeFile};