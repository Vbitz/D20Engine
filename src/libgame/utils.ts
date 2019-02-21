import * as Core from 'core';
import * as Game from 'libgame';

/**
 *
 */
export type GetterFunction<T> = () => T;

/**
 *
 */
export type SetterFunction<T> = (value: T) => void;

export interface Property<T> {
  get: Core.Event<GetterFunction<T>>;
  set: Core.Event<SetterFunction<T>>;
}

/**
 *
 */
export function Property<T>(): Property<T> {
  return {
    get: new Core.Event<GetterFunction<T>>(),
    set: new Core.Event<SetterFunction<T>>()
  };
}

type ReadableFields<Properties extends Core.ComponentParameters> =
    Core.ComponentSerializableFields<Properties>;

/**
 * Implements a property as a getter setter pair for component. Parameters
 * should be automatically inferred from content.
 * @param ctx A valid content to register the handlers with.
 * @param component The component to register the parameters on.
 * @param prop A get/set property of events to register handlers for.
 * @param key The key of the component's parameters to use for storage.
 */
export async function
propertyImplementation<Parameters extends Core.ComponentParameters>(
    ctx: Core.Context, component: Core.Component<Parameters>,
    prop: Property<Parameters[keyof ReadableFields<Parameters>]>,
    key: keyof ReadableFields<Parameters>) {
  // Well that was a difficult method. It took 10 minutes to write the
  // implementation and 50 minutes or more to debug the signature.

  // TODO(joshua): It may be possible to make this a decorator.

  ctx.registerComponentHandler(component, prop.get, async (ctx) => {
    return component.parameters[key];
  });

  ctx.registerComponentHandler(component, prop.set, async (ctx, value) => {
    await component.setState(
        ctx, {[key]: value} as Partial<ReadableFields<Parameters>>);
  });
}