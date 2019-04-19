import * as Core from '.';

export interface ComponentPrivate {}

export abstract class Component<T extends Core.StatefulObject> {
  constructor(private _state: T) {}

  abstract async onCreate(ctx: Core.Context): Promise<void>;
}

// tslint:disable-next-line: no-any
export type AnyComponent = Component<Core.StatefulObject>;