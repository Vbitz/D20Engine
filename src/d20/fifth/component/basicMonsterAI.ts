import * as Core from 'core';
import * as Fifth from 'd20/fifth';

export class BasicMonsterAIParameters extends Core.ComponentParameters {}

export class BasicMonsterAI extends Core.Component<BasicMonsterAIParameters> {
  constructor() {
    super(new BasicMonsterAIParameters());
  }

  async onCreate(ctx: Core.Context): Promise<void> {}
}