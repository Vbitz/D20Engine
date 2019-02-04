import * as Core from 'core';

import * as DiceParser from './dice2.parser';

export const enum DiceNodeType {
  Operation = 'op',
  Function = 'function',
  Roll = 'roll',
  Template = 'template',
  Macro = 'macro',
  Offset = 'offset',
  Constant = 'const'
}

export class BaseDiceNode {}

export const enum OperationType {
  Plus = '+',
  Minus = '-',
  Multiply = '*',
  Divide = '/'
}

export interface OperationNode extends BaseDiceNode {
  kind: DiceNodeType.Operation;

  lhs: DiceNode;
  rhs: DiceNode;
  operation: OperationType;
}

export const enum BuiltinFunction {
  Advantage = 'adv',
  Disadvantage = 'dis',
  Repeat = 'repeat',
  Drop = 'drop'
  // TODO(joshua): explode function.
}

export type FunctionName = BuiltinFunction|MacroNode;

export interface FunctionNode extends BaseDiceNode {
  kind: DiceNodeType.Function;

  target: FunctionName;
  args: DiceNode[];
}

export interface RollNode extends BaseDiceNode {
  kind: DiceNodeType.Roll;

  count: number;
  type: number;
}

export interface TemplateNode extends BaseDiceNode {
  kind: DiceNodeType.Template;

  id: number;
}

export interface MacroNode extends BaseDiceNode {
  kind: DiceNodeType.Macro;

  id: string;
}

export const enum OffsetType {
  Plus = '+',
  Minus = '-'
}

export interface OffsetNode extends BaseDiceNode {
  kind: DiceNodeType.Offset;

  type: OffsetType;
  value: number;
}

export interface ConstNode extends BaseDiceNode {
  kind: DiceNodeType.Constant;

  value: number;
}

/**
 * Dice AST Node.
 */
export type DiceNode =
    OperationNode|FunctionNode|RollNode|TemplateNode|MacroNode|OffsetNode|ConstNode;

export const enum DiceValueType {
  Number = 'number',
  Array = 'array',
  Macro = 'macro',
  Function = 'function',
  Node = 'node'
}

export interface BaseDiceValue {}

export interface ArrayValue extends BaseDiceValue {
  kind: DiceValueType.Array;

  arrayType: DiceValueType;
  values: DiceValue[];
}

export interface NumberValue extends BaseDiceValue {
  kind: DiceValueType.Number;

  value: number;
}

export interface MacroValue extends BaseDiceValue {
  kind: DiceValueType.Macro;

  value: DiceValue;
}

export interface FunctionValue extends BaseDiceValue {
  kind: DiceValueType.Function;

  argumentTypes: DiceValueType[];
  callback: BuiltinFunctionCallback;
}

export interface NodeValue extends BaseDiceValue {
  kind: DiceValueType.Node;

  node: DiceNode;
}

export type DiceValue =
    ArrayValue|NumberValue|MacroValue|FunctionValue|NodeValue;

export interface DiceNodeResult<T extends DiceValue> {
  value: T;
}

export type OperationResultNode = OperationNode&DiceNodeResult<DiceValue>;
export type FunctionResultNode = FunctionNode&DiceNodeResult<DiceValue>;
export type RollResultNode = RollNode&DiceNodeResult<ArrayValue>;
export type TemplateResultNode = TemplateNode&DiceNodeResult<DiceValue>;
export type MacroResultNode = MacroNode&DiceNodeResult<MacroValue>;
export type OffsetResultNode = OffsetNode&DiceNodeResult<NumberValue>;
export type ConstResultNode = ConstNode&DiceNodeResult<NumberValue>;

export type DiceResultNode =
    OperationResultNode|FunctionResultNode|RollResultNode|TemplateResultNode|MacroResultNode|OffsetResultNode|ConstResultNode;

export interface DiceResult {
  inputTree: DiceResultNode;
  result: DiceValue;
}

class DiceState {
  private templates: Map<number, DiceNode> = new Map();
}

export class DiceExecuter {
  private state = new DiceState();

  constructor(private owner: DiceGenerator, private node: DiceNode) {}

  withTemplate(id: number, node: DiceValue) {}

  run(): DiceResult {
    const inputTree = this.owner.execute(this.state, this.node);

    return {inputTree, result: inputTree.value};
  }
}

type BuiltinFunctionCallback =
    (this: DiceGenerator, state: DiceState, args: DiceNode[]) => DiceResultNode;

export class DiceGenerator {
  private macros: Map<string, MacroValue> = new Map();
  private builtinFunctions: Map<BuiltinFunction, FunctionValue> = new Map();

  constructor(private random: Core.Common.RandomFunction) {}

  beginExecute(node: DiceNode): DiceExecuter {
    return new DiceExecuter(this, node);
  }

  execute(state: DiceState, node: DiceNode): DiceResultNode {
    if (node.kind === DiceNodeType.Operation) {
      throw new Error('Not Implemented');
    } else if (node.kind === DiceNodeType.Function) {
      const functionSignature = this.getFunction(state, node.target);

      const value = functionSignature.callback.call(this, state, node.args);

      throw new Error('Function Not Implemented');
    } else {
      throw new Error('Not Implemented: ' + node.kind);
    }
  }

  static parse(input: string) {
    return DiceParser.parse(input) as DiceNode;
  }

  private addBuiltin(
      name: BuiltinFunction, argumentTypes: DiceValueType[],
      callback: BuiltinFunctionCallback) {
    this.builtinFunctions.set(
        name, {kind: DiceValueType.Function, argumentTypes, callback});
  }

  private getFunction(state: DiceState, name: FunctionName): FunctionValue {
    if (typeof name === 'string') {
      return this.builtinFunctions.get(name) || Core.Common.expect();
    } else {
      const macro = this.getMacro(state, name.id);
      if (macro === undefined) {
        throw new Error('Macro is undefined.');
      }

      const value = macro.value;

      if (!this.isFunction(value)) {
        throw new Error('Macro is not a Function.');
      }

      return value;
    }
  }

  private getMacro(state: DiceState, name: string): MacroValue|undefined {
    return this.macros.get(name);
  }

  private isArray(value: DiceValue): value is ArrayValue {
    return value.kind === DiceValueType.Array;
  }

  private isNumber(value: DiceValue): value is NumberValue {
    return value.kind === DiceValueType.Number;
  }

  private isMacro(value: DiceValue): value is MacroValue {
    return value.kind === DiceValueType.Macro;
  }

  private isFunction(value: DiceValue): value is FunctionValue {
    return value.kind === DiceValueType.Function;
  }

  private isNode(value: DiceValue): value is NodeValue {
    return value.kind === DiceValueType.Node;
  }
}