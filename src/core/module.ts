import * as Core from 'core';

export abstract class Module {
  readonly uuid = Core.Common.createUUID();

  abstract async onCreate(ctx: Core.Context): Promise<void>;
}