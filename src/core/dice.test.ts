import * as assert from 'assert';

import {RandomFunction} from './common';
import {DiceGenerator, DiceType} from './dice';

function createStaticRandom(values: number[]): RandomFunction {
  const generator = function*() {
    let i = 0;
    while (true) {
      yield values[i++ % values.length];
    }
  }();

  return () => {
    return generator.next().value;
  };
}

function staticGenerator(values: number[]) {
  return new DiceGenerator(createStaticRandom(values));
}

function simpleTest(values: number[], roll: string) {
  const gen = staticGenerator(values);
  return gen.parseAndExecute(roll).value;
}

describe('DiceGenerator', () => {
  test('Constant', () => {
    const gen = staticGenerator([]);

    assert.strictEqual(gen.execute(DiceGenerator.constant(10)).value, 10);
  });

  test('DiceRoll_Simple', () => {
    const gen = staticGenerator([1 / 6]);
    assert.strictEqual(gen.parseAndExecute('d6').value, 2);

    assert.notStrictEqual(gen.parseAndExecute('d6').value, 3);
  });

  test('DiceRoll_Advanced', () => {
    assert.strictEqual(simpleTest([1 / 20, 2 / 20, 3 / 20], '3d20'), 9);
  });

  test('DiceRollConstant', () => {
    assert.strictEqual(simpleTest([0], '20'), 20);
  });

  test('DiceRollOp_Add', () => {
    assert.strictEqual(simpleTest([0], '2+2'), 4);
  });

  test('DiceRollOp_Subtract', () => {
    assert.strictEqual(simpleTest([0], '10-2'), 8);
  });

  test('DiceRollOp_Nested', () => {
    assert.strictEqual(simpleTest([0], '10-2+2'), 10);
  });

  test('DiceRollDrop_Trivial', () => {
    assert.strictEqual(simpleTest([1 / 6], 'drop(3d6,-1)'), 4);
  });

  test('DiceRollDrop_Basic_Low', () => {
    assert.strictEqual(simpleTest([1 / 6, 2 / 6, 3 / 6], 'drop(3d6,-1)'), 7);
  });

  test('DiceRollDrop_Basic_High', () => {
    assert.strictEqual(simpleTest([1 / 6, 2 / 6, 3 / 6], 'drop(3d6,+1)'), 5);
  });

  test('Complex', () => {
    assert.strictEqual(
        simpleTest([1 / 6, 2 / 6, 3 / 6, 4 / 6], 'drop(4d6,+1)+10'), 19);
  });

  test('Reroll_Basic', () => {
    const gen = staticGenerator([1 / 6, 2 / 6]);

    const results = gen.parseAndExecute('d6');

    assert.strictEqual(results.value, 2);

    const newResults = gen.rerollAll(results);

    assert.strictEqual(newResults.value, 3);
  });

  test('Reroll_Complex', () => {
    const gen = staticGenerator(
        [1 / 6, 2 / 6, 3 / 6, 4 / 6, 6 / 6, 2 / 6, 1 / 6, 6 / 6]);

    const results = gen.parseAndExecute('drop(4d6,+1)+10');

    assert.strictEqual(results.value, 19);

    const newResults = gen.rerollAll(results);

    assert.strictEqual(newResults.value, 22);
  });

  test('Parse_Simple', () => {
    ['d6', 'd12', 'd20', '2d20', 'd6+1', 'd20+d20', 'drop(4d20,-1)',
     'drop(4d20,+1)']
        .forEach((spec) => {
          DiceGenerator.parse(spec);
        });
  });

  test('Parse_Execute', () => {
    const gen = staticGenerator([1 / 6]);

    const results = gen.execute(DiceGenerator.parse('d6'));

    assert.strictEqual(results.value, 2);
  });

  test('Parse_Complex', () => {
    const gen =
        staticGenerator([6 / 10, 5 / 10, 1 / 10, 3 / 10, 2 / 10, 9 / 10]);

    const results =
        gen.execute(DiceGenerator.parse('drop(2d10,-1)+20+drop(4d10,+2)+10'));

    assert.strictEqual(results.value, 42);
  });

  test('GetComplexity', () => {
    function getSpecComplexity(spec: string) {
      return DiceGenerator.getComplexity(DiceGenerator.parse(spec));
    }

    assert.strictEqual(getSpecComplexity('d6'), 1);
    assert.strictEqual(getSpecComplexity('d12'), 1);
    assert.strictEqual(getSpecComplexity('d20'), 1);

    assert.strictEqual(getSpecComplexity('4d6'), 4);

    assert.strictEqual(getSpecComplexity('2d6+2'), 5);

    assert.strictEqual(getSpecComplexity('2d6+2d20'), 6);

    assert.strictEqual(
        getSpecComplexity('drop(2d10,-1)+20+drop(4d10,+2)+10'), 20);
  });
});