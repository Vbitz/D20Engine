import * as Core from 'core';

export abstract class Module {
  abstract async onCreate(ctx: Core.Context): Promise<void>;
}