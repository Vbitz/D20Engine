import * as Core from 'core';
import * as Fifth from 'd20/fifth';

// Much HAX
// tslint:disable-next-line:no-any
(process as any).binding('config').experimentalREPLAwait = true;

import * as repl from 'repl';

export async function replMain(args: string[]) {
  const server = repl.start({});

  Object.defineProperty(
      server.context, 'Core',
      {configurable: false, enumerable: true, value: Core});

  Object.defineProperty(
      server.context, 'Fifth',
      {configurable: false, enumerable: true, value: Fifth});

  return 0;
}