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
  abstract replyUser(text: string): Promise<void>;
  abstract validateAdmin(): Promise<void>;

  abstract getUserID(): string;

  async chainRPC(
      ctx: Core.Context,
      entity: Core.Entity|Core.Component<Core.StatefulObject>,
      chain: Core.Value[]): Promise<void> {
    return await entity.executeRPC(ctx, this, chain);
  }

  initServer(server: Server, game: Core.Game) {
    this._server = server;
    this._game = game;
  }
}

class Marshal {
  id = Symbol();

  constructor(
      readonly marshalCallback: Core.RPC.MarshalCallback,
      readonly helpText: string) {}
}

export class MarshalNotFoundError extends Error {
  constructor(message: string) {
    super(`MarshalNotFound: ${message}`);
  }
}

export class MarshalUsageError extends Error {
  constructor(message: string) {
    super(`Usage: ${message}`);
  }
}

export class ControllerImpl {
  private marshals: Map<string, Marshal> = new Map();

  async execute(
      ctx: Core.Context, rpcCtx: Core.RPC.Context, chain: Core.Value[]) {
    if (chain.length === 0) {
      // If we are at the end of the chain and there is not a special handler
      // then print help.
      await this.printHelp(ctx, rpcCtx);

      return;
    }

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

  addMarshal(
      name: string, helpText: string,
      marshalCallback: Core.RPC.MarshalCallback): void {
    this.marshals.set(name, new Marshal(marshalCallback, helpText));
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

  generateGraph(entityId: string|symbol, graphInterface: Core.GraphInterface) {
    for (const [key, marshal] of this.marshals) {
      graphInterface.addNode(marshal.id, 'RPCMarshal', key);
      graphInterface.addEdge(entityId, marshal.id);
    }
  }

  /**
   * Replies through a RPCContext a markdown description of all registered RPCs.
   * @param ctx
   * @param rpcCtx
   */
  private async printHelp(ctx: Core.Context, rpcCtx: Core.RPC.Context) {
    let ret = ``;
    for (const [name, marshal] of this.marshals) {
      ret += `\`${name}\` - ${marshal.helpText}\n`;
    }
    await rpcCtx.replyUser(ret);
  }
}

export class Server {
  // TODO(joshua): Add map of currently interacting users to keep track of there
  // current interaction.

  constructor(
      private owner: Core.Game, private rootEntity: Core.Entity,
      private rpcContext: Core.Context) {}

  async execute(ctx: Context, chain: Core.Value[]) {
    ctx.initServer(this, this.owner);

    const rpcExecutionContext = this.rpcContext.createChildContext();

    rpcExecutionContext.setInteractionInterface(
        this.onInteraction.bind(this, ctx));

    await this.rootEntity.executeRPC(rpcExecutionContext, ctx, chain);
  }

  private async onInteraction(
      rpcContext: Context, ctx: Core.Context, interaction: Core.Interaction) {
    // Extract documentation and current user for interaction.
  }
}