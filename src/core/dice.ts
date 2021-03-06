/**
 * Dice Generator
 *
 * # Language 2.0
 * - `adv(d20)` and `dis(d20)` for advantage and disadvantage.
 * - Macros. Maybe?
 * - `repeat(d20, 6)` Like a for loop. Useful for random characters.
 */

// import * as Core from 'core';

import {expect, RandomFunction} from './common';
import * as DiceParser from './dice.parser';

export const enum DiceType {
  D4 = 4,
  D6 = 6,
  D8 = 8,
  D10 = 10,
  D12 = 12,
  D20 = 20,
  D100 = 100
}

interface BaseDiceSpec {}

export interface DiceRoll extends BaseDiceSpec {
  kind: 'roll';
  type: DiceType;
  count: number;
}

export interface DiceRollOp extends BaseDiceSpec {
  kind: 'op';
  op: '+'|'-';
  lhs: DiceNode;
  rhs: DiceNode;
}

export interface DiceRollConstant extends BaseDiceSpec {
  kind: 'const';
  value: number;
}

export interface DiceRollDrop extends BaseDiceSpec {
  kind: 'drop';
  roll: DiceRoll;
  type: 'low'|'high';
  /** Drop `count` low or high dice */
  count: number;
}

export interface ResultValue extends BaseDiceSpec {
  value: number;
}

export type RolledDice = DiceRoll&{rolls: number[]}&ResultValue;

export type RolledDiceOp = {
  kind: 'op',
  op: '+'|'-',
  lhs: RolledNode,
  rhs: RolledNode
}&ResultValue;

export type RolledDiceDrop = {
  kind: 'drop',
  roll: RolledDice,
  type: 'low'|'high',
  /** Drop `count` low or high dice */
  count: number
}&ResultValue;

export type DiceNode = DiceRoll|DiceRollOp|DiceRollConstant|DiceRollDrop;

export class DiceSpecification {
  private __diceSpecificationTag = 0;

  constructor(public node: DiceNode) {}
}

export type RolledNode =
    RolledDice|RolledDiceOp|RolledDiceDrop|DiceRollConstant;

export class RolledSpecification {
  private __rolledSpecificationTag = 0;

  constructor(public node: RolledNode) {}
}

export class DiceResults {
  private __diceResultsTag = 0;

  constructor(public rolledSpec: RolledNode, public value: number) {}
}

export class DiceGenerator {
  constructor(private randomProvider: RandomFunction) {}

  execute(spec: DiceSpecification): DiceResults {
    const rolledSpec = this._execute(spec.node);
    return new DiceResults(rolledSpec, rolledSpec.value);
  }

  parseAndExecute(spec: string): DiceResults {
    return this.execute(DiceGenerator.parse(spec));
  }

  parseAndExplain(spec: string): string {
    return DiceGenerator.explain(this.parseAndExecute(spec));
  }

  rerollAll(results: DiceResults): DiceResults {
    const rolledSpec = this._execute(results.rolledSpec);
    return new DiceResults(rolledSpec, rolledSpec.value);
  }

  static parse(spec: string): DiceSpecification {
    return new DiceSpecification(DiceParser.parse(spec));
  }

  static constant(value: number): DiceSpecification {
    return new DiceSpecification({kind: 'const', value});
  }

  static constantResult(value: number): DiceResults {
    return new DiceResults({kind: 'const', value}, value);
  }

  static getComplexity(spec: DiceSpecification): number {
    return this._getComplexity(spec.node);
  }

  private static _getComplexity(spec: DiceNode): number {
    if (spec.kind === 'const') {
      return 1;
    } else if (spec.kind === 'drop') {
      return 2 * DiceGenerator._getComplexity(spec.roll);
    } else if (spec.kind === 'op') {
      return 2
          + (DiceGenerator._getComplexity(spec.lhs)
             + DiceGenerator._getComplexity(spec.rhs));
    } else if (spec.kind === 'roll') {
      return spec.count;
    } else {
      throw new Error('Not Implemented');
    }
  }

  /**
   * Returns a string in Markdown format.
   * @param results
   */
  static explain(results: DiceResults): string {
    return `${this._explain(results.rolledSpec)} = **${results.value}**`;
  }

  private static _explain(spec: RolledNode): string {
    if (spec.kind === 'roll') {
      const roll = spec.rolls.slice().sort((a, b) => a - b);
      return `{${roll.slice(0, roll.length - 1).join(',')},**${
          roll[roll.length - 1]}**}`;
    } else if (spec.kind === 'op') {
      return `${this._explain(spec.lhs)} ${spec.op} ${this._explain(spec.rhs)}`;
    } else if (spec.kind === 'drop') {
      const arr = spec.roll.rolls.slice().sort((a, b) => a - b);

      console.log(arr.join(','));

      const finalDice = arr.length - spec.count;

      console.log(finalDice);

      if (spec.type === 'low') {
        const keptDice = arr.slice(spec.count);
        const droppedDice = arr.slice(0, spec.count);

        return `{~~${droppedDice.join('~~,~~')}~~,${
            keptDice.slice(0, keptDice.length - 1).join(',')},**${
            keptDice[keptDice.length - 1]}**}`;
      } else if (spec.type === 'high') {
        const keptDice = arr.slice(0, finalDice);
        const droppedDice = arr.slice(finalDice);

        return `{${keptDice.slice(0, keptDice.length - 1).join(',')},**${
            keptDice[keptDice.length - 1]}**,~~${droppedDice.join('~~,~~')}~~}`;
      }

      return expect();
    } else if (spec.kind === 'const') {
      return spec.value.toString(10);
    } else {
      return expect();
    }
  }

  private _execute(spec: DiceNode): RolledNode {
    if (spec.kind === 'const') {
      return {kind: spec.kind, value: spec.value};
    } else if (spec.kind === 'roll') {
      const rolls =
          Array.from({length: spec.count}, () => this._rollDice(spec.type));

      return {
        kind: spec.kind,
        value: rolls.reduce((a, b) => a + b, 0),
        rolls,
        count: spec.count,
        type: spec.type
      };
    } else if (spec.kind === 'drop') {
      const rollResults = this._execute(spec.roll) as RolledDice;

      let sortedRolls = [...rollResults.rolls].sort((a, b) => a - b);

      const finalDice = sortedRolls.length - spec.count;

      if (spec.type === 'low') {
        sortedRolls = sortedRolls.reverse();
      }

      sortedRolls.splice(finalDice, spec.count);

      const value = sortedRolls.reduce((a, b) => a + b, 0);

      return {
        kind: spec.kind,
        type: spec.type,
        roll: rollResults,
        count: spec.count,
        value
      };
    } else if (spec.kind === 'op') {
      const lhs = this._execute(spec.lhs);
      const rhs = this._execute(spec.rhs);

      let value = 0;

      if (spec.op === '+') {
        value = lhs.value + rhs.value;
      } else if (spec.op === '-') {
        value = lhs.value - rhs.value;
      }

      return {kind: spec.kind, value, op: spec.op, lhs, rhs};
    } else {
      throw new Error('Not Implemented');
    }
  }

  private _rollDice(type: DiceType) {
    return ((this.randomProvider() * type) | 0) + 1;
  }
}