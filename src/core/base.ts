import * as Core from 'core';

import {exists as _exists} from 'fs';
import * as path from 'path';
import {promisify} from 'util';

const exists = promisify(_exists);

const CONFIG_FILENAME = 'd20Engine.config.json';

const SAVE_DIRECTORY = 'save';
const RESOURCE_DIRECTORY = 'res';
const CONFIG_DIRECTORY = 'config';

export interface GameLike {
  readonly game: Core.Game;
}

type PrimitiveValue = string|boolean|number|null|undefined;

type ComplexPrimativeValue =
    PrimitiveValue|Core.DiceResults|Core.DiceSpecification|Core.StatefulObject;

type NonNullablePrimitive = Exclude<ComplexPrimativeValue, null|undefined>;

interface JSONObject<T> {
  [s: string]: T|JSONObject<T>|Array<JSONObject<T>>;
}

export type NonNullableValue =
    JSONObject<NonNullablePrimitive>|NonNullablePrimitive;

export type Value = JSONObject<ComplexPrimativeValue>|ComplexPrimativeValue;

export function asString(value: Core.Value): string {
  if (typeof (value) === 'string') {
    return value;
  } else if (typeof (value) === 'number') {
    return value.toString(10);
  } else {
    throw new Error('Not Implemented');
  }
}

export interface EventController {
  _registerHandler<T extends Core.EventDeclaration>(
      evt: T, cb: Core.HandlerCallback<T>): void;

  _getHandlers<T extends Core.EventDeclaration>(evt: T):
      Array<Core.HandlerCallback<T>>;

  _callHandlers<T extends Core.EventDeclaration>(
      ctx: Core.Context, evt: T, handlers: Array<Core.HandlerCallback<T>>,
      args: Core.EventArgs<T>): Core.Action<T>;
}

export class AbstractEventController {
  private eventController = new Core.EventControllerImpl();
  private rpcController = new Core.RPC.ControllerImpl();

  /**
   * Register a new handler for an event.
   * @param evt The event to attach a handler to.
   * @param cb The callback for the handler.
   */
  protected _registerHandler<T extends Core.EventDeclaration>(
      evt: T, cb: Core.HandlerCallback<T>): void {
    this.eventController._registerHandler(evt, cb);
  }

  /**
   * Get all handlers for `evt`. Returns an empty array if no handlers are
   * registered.
   * @param evt The event to get handlers for.
   */
  protected _getHandlers<T extends Core.EventDeclaration>(evt: T):
      Array<Core.HandlerCallback<T>> {
    return this.eventController._getHandlers(evt);
  }

  /**
   * This method is technically safe to call with handlers from other instances
   * of `EventController`. This method may become static in the future.
   * @param ctx The context to execute the call with.
   * @param evt Only used for type checking of arguments.
   * @param handlers The list of handlers to try calling.
   * @param args The array of arguments to call the event with.
   */
  protected _callHandlers<T extends Core.EventDeclaration>(
      ctx: Core.Context, evt: T, handlers: Array<Core.HandlerCallback<T>>,
      args: Core.EventArgs<T>): Core.Action<T> {
    return this.eventController._callHandlers(ctx, evt, handlers, args);
  }

  protected async _executeRPC(
      ctx: Core.Context, rpcCtx: Core.RPC.Context,
      chain: Core.Value[]): Promise<void> {
    return await this.rpcController.execute(ctx, rpcCtx, chain);
  }

  protected _addRPCMarshal(
      name: string, helpText: string,
      marshalCallback: Core.RPC.MarshalCallback) {
    return this.rpcController.addMarshal(name, helpText, marshalCallback);
  }

  protected _hasRPCMarshal(chain: Core.Value[]) {
    return this.rpcController.hasMarshal(chain);
  }

  protected _generateGraph(
      entityId: string|symbol, graphInterface: Core.GraphInterface) {
    this.eventController.generateGraph(entityId, graphInterface);
    this.rpcController.generateGraph(entityId, graphInterface);
  }
}

async function getRootPath(dirname: string): Promise<string> {
  // TODO(joshua): Handle if CONFIG_FILENAME does not exist up the tree.

  if (await exists(path.join(dirname, CONFIG_FILENAME))) {
    return dirname;
  } else {
    return await getRootPath(path.resolve(dirname, '..'));
  }
}

export async function getSavePath(): Promise<string> {
  const rootPath = await getRootPath(__dirname);

  return path.join(rootPath, SAVE_DIRECTORY);
}

export async function getResourcePath(): Promise<string> {
  const rootPath = await getRootPath(__dirname);

  return path.join(rootPath, RESOURCE_DIRECTORY);
}

export async function getConfigPath(): Promise<string> {
  const rootPath = await getRootPath(__dirname);

  return path.join(rootPath, CONFIG_DIRECTORY);
}

export async function getVersion(): Promise<string> {
  const rootPath = await getRootPath(__dirname);

  // TODO(joshua): This assumes deployments are happening from master.
  const refHashFile = path.join(rootPath, '.git', 'refs', 'heads', 'master');

  return await Core.Common.readFile(refHashFile, 'utf8');
}