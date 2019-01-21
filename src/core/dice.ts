import * as Core from 'core';

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
  lhs: DiceSpecification;
  rhs: DiceSpecification;
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

export type RolledDiceOp = DiceRollOp&ResultValue;

export type RolledDiceDrop = DiceRollDrop&ResultValue;

export type DiceSpecification =
    DiceRoll|DiceRollOp|DiceRollConstant|DiceRollDrop;

export type RolledSpecification =
    RolledDice|RolledDiceOp|RolledDiceDrop|DiceRollConstant;

export interface DiceResults {
  rolledSpec: RolledSpecification;
  value: number;
}

export class SpecificationCompiler {
  /** roll */
  d(type: DiceType, count = 1): DiceRoll {
    return {kind: 'roll', type, count};
  }

  /** constant */
  c(value: number): DiceRollConstant {
    return {kind: 'const', value};
  }

  add(lhs: DiceSpecification, rhs: DiceSpecification): DiceRollOp {
    return {kind: 'op', op: '+', lhs, rhs};
  }

  sub(lhs: DiceSpecification, rhs: DiceSpecification): DiceRollOp {
    return {kind: 'op', op: '-', lhs, rhs};
  }

  drop(roll: DiceRoll, type: DiceRollDrop['type'], count: number):
      DiceRollDrop {
    return {kind: 'drop', roll, type, count};
  }
}

export type CompilerCallback = (_: SpecificationCompiler) => DiceSpecification;

export class DiceGenerator {
  constructor(private randomProvider: Core.Common.RandomFunction) {}

  execute(spec: DiceSpecification): DiceResults {
    const rolledSpec = this._execute(spec);
    return {rolledSpec, value: rolledSpec.value};
  }

  compileAndExecute(cb: CompilerCallback): DiceResults {
    return this.execute(DiceGenerator.compile(cb));
  }

  parseAndExecute(spec: string): DiceResults {
    return this.execute(DiceGenerator.parse(spec));
  }

  rerollAll(results: DiceResults) {
    return this.execute(results.rolledSpec);
  }

  static compile(cb: CompilerCallback): DiceSpecification {
    return cb(new SpecificationCompiler());
  }

  static parse(spec: string): DiceSpecification {
    return DiceParser.parse(spec) as DiceSpecification;
  }

  static getComplexity(spec: DiceSpecification): number {
    if (spec.kind === 'const') {
      return 1;
    } else if (spec.kind === 'drop') {
      return 2 * DiceGenerator.getComplexity(spec.roll);
    } else if (spec.kind === 'op') {
      return 2 +
          (DiceGenerator.getComplexity(spec.lhs) +
           DiceGenerator.getComplexity(spec.rhs));
    } else if (spec.kind === 'roll') {
      return spec.count;
    } else {
      throw new Error('Not Implemented');
    }
  }

  private _execute(spec: DiceSpecification): RolledSpecification {
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