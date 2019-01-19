import * as Core from 'core';

export class Game {
  private context = new Core.Context(this);

  random() {
    return Math.random();
  }

  /**
   * Register and initialize a module within this `Game` instance.
   * @param mod The module to register.
   */
  async registerModule(mod: Core.Module) {
    await mod.onCreate(this.context);
  }
}