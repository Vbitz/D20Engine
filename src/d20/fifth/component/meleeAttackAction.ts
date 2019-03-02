import * as Core from 'core';
import * as Fifth from 'd20/fifth';

export const getAttackRoll = new Core.Event<() => Core.DiceSpecification>();

export const getDamageRoll = new Core.Event<() => Core.DiceSpecification>();

export class MeleeAttackActionParameters extends Core.StatefulObject {
  name: string;
  hitBonus: number;
  reach: number;
  damageRoll: Core.DiceSpecification;
  damageType: Fifth.DamageType;

  constructor() {
    super();

    this.name = '';
    this.hitBonus = 2;
    this.reach = 5;
    this.damageRoll = Core.DiceGenerator.parse('d6');
    this.damageType = Fifth.DamageType.Bludgeoning;
  }
}

export class MeleeAttackAction extends
    Core.Component<MeleeAttackActionParameters> {
  constructor() {
    super(new MeleeAttackActionParameters());
  }

  async onCreate(ctx: Core.Context) {
    throw new Error('Method not implemented.');
  }
}

Core.Reflect.embed(module);