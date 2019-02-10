process.env.NODE_PATH = __dirname;
require('module').Module._initPaths();

import {ecsTestMain} from 'core/ecsTest.main';
import {botMain} from 'core/bot';
import {combatTestMain} from 'd20/fifth/combat/test.main';
import {frontendGeneratorTest} from 'tools/frontendGeneratorTest';
import {diceMain} from 'core/dice.main';
import {replMain} from 'tools/repl';
import {botReplMain} from 'core/bot/repl';

async function main(args: string[]) {
  if (args[0] === 'test:ecs') {
    return await ecsTestMain(args.slice(1));
  } else if (args[0] === 'test:combat') {
    return await combatTestMain(args.slice(1));
  } else if (args[0] === 'test:frontend') {
    return await frontendGeneratorTest(args.slice(1));
  } else if (args[0] === 'bot') {
    return await botMain(args.slice(1));
  } else if (args[0] === 'dice') {
    return await diceMain(args.slice(1));
  } else if (args[0] === 'repl') {
    return await replMain(args.slice(2));
  } else if (args[0] === 'bot:repl') {
    return await botReplMain(args.slice(2));
  } else {
    throw new Error('Invalid Entry Point');
  }
}

if (process.mainModule === module) {
  main(process.argv.slice(2))
      .then((exitCode) => process.exitCode = exitCode)
      .catch((err) => {
        console.error('Fatal', err);
        process.exit(1);
      });
}