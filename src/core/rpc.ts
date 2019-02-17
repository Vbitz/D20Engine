import * as Core from 'core';

export type MarshalCallback =
    (ctx: Core.Context, rpcCtx: Core.RPC.Context, chain: Core.Value[]) =>
        Promise<void>;

export abstract class Context {
  private _server: Server|null = null;
  private _game: Core.Game|null = null;

  get server() {
    return this._server || Core.Common.expect();
  }

  get game() {
    return this._game || Core.Common.expect();
  }

  abstract reply(text: string): Promise<void>;

  abstract getUserID(): string;

  async chainRPC(
      ctx: Core.Context,
      entity: Core.Entity|Core.Component<Core.ComponentParameters>,
      chain: Core.Value[]): Promise<void> {
    return await entity.executeRPC(ctx, this, chain);
  }

  initServer(server: Server, game: Core.Game) {
    this._server = server;
    this._game = game;
  }
}

class Marshal {
  constructor(readonly marshalCallback: Core.RPC.MarshalCallback) {}
}

export class MarshalNotFoundError extends Error {
  constructor(message: string) {
    super(`MarshalNotFound: ${message}`);
  }
}

export class ControllerImpl {
  private marshals: Map<string, Marshal> = new Map();

  async execute(
      ctx: Core.Context, rpcCtx: Core.RPC.Context, chain: Core.Value[]) {
    const [first, ...rest] = chain;

    if (typeof (first) !== 'string') {
      throw new Error('First Chain value is not a string');
    }

    const firstValue = this.getCommand(first);

    if (firstValue === undefined) {
      throw new MarshalNotFoundError('');
    }

    const marshal = this.marshals.get(firstValue)!;

    await marshal.marshalCallback(ctx, rpcCtx, rest);
  }

  hasMarshal(chain: Core.Value[]): boolean {
    const [first, ...rest] = chain;

    if (typeof (first) !== 'string') {
      return false;
    }

    const firstValue = this.getCommand(first);
    if (firstValue === undefined) {
      return false;
    } else {
      return this.marshals.has(firstValue);
    }
  }

  addMarshal(name: string, MarshalCallback: Core.RPC.MarshalCallback): void {
    this.marshals.set(name, new Marshal(MarshalCallback));
  }

  getCommand(name: string): string|undefined {
    const result = [...this.marshals].find(
        ([key, _]) => key.toLowerCase() === name.toLowerCase());

    if (result === undefined) {
      return undefined;
    } else {
      return result[0];
    }
  }
}

export class Server {
  constructor(
      private owner: Core.Game, private rootEntity: Core.Entity,
      private rpcContext: Core.Context) {}

  async execute(ctx: Context, chain: Core.Value[]) {
    ctx.initServer(this, this.owner);
    await this.rootEntity.executeRPC(this.rpcContext, ctx, chain);
  }
}