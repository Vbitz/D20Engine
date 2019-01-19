process.env.NODE_PATH = __dirname;
require('module').Module._initPaths();

import {ecsTestMain} from 'core/ecsTest.main';

async function main(args: string[]) {
  if (args[0] === 'test:ecs') {
    return await ecsTestMain(args.slice(1));
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