import * as Core from 'core';

export async function diceMain(args: string[]) {
  const diceGenerator = new Core.DiceGenerator(() => Math.random());

  const parsedTree = Core.DiceGenerator.parse(args[0]);

  const results = diceGenerator.execute(parsedTree);

  const complexity = Core.DiceGenerator.getComplexity(parsedTree);

  const explainedResults = Core.DiceGenerator.explain(results);

  console.log(`Complexity: ${complexity.toString(10)}`);
  console.log(`Results: ${explainedResults}`);

  return 0;
}