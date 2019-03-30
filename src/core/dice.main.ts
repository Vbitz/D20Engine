import * as Core from 'core';
import * as repl from 'repl';
import * as vm from 'vm';

export async function diceMain(args: string[]) {
  const diceGenerator = new Core.DiceGenerator(() => Math.random());

  const server = repl.start({
    prompt: '> ',
    eval:
        (evalCmd: string, context: vm.Context, file: string,
         // tslint:disable-next-line:no-any
         cb: (err: Error|null, result: any) => void) => {
          const message = evalCmd.substr(0, evalCmd.length - 1);

          const parsedTree = Core.DiceGenerator.parse(message);

          const results = diceGenerator.execute(parsedTree);

          const explainedResults = Core.DiceGenerator.explain(results);

          cb(null, explainedResults);
        }
  });

  return 0;
}