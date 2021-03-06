import * as Core from 'core';
import * as Fifth from 'd20/fifth';

export const getInitiativeRoll = new Core.Event<() => Core.DiceSpecification>();

export const getArmorClass = new Core.Event<() => Core.DiceSpecification>();

export const getHitPoints = new Core.Event<() => Core.DiceSpecification>();

export const isDead = new Core.Event<() => boolean>();

export const doTurn = new Core.Event<() => void>();

export const doAttack = new Core.Event<(args: {target: Core.Entity}) => void>();

export interface DamageArguments {
  source: Core.Entity;

  amount: Core.DiceSpecification;
}

export const doDamage =
    new Core.Event<(args: DamageArguments) => Core.Dice.DiceResults>();

export class CreatureParameters extends Core.StatefulObject {
  size: Fifth.Size;
  type: Fifth.CreatureType;

  armorClass: number;
  hitPointsRoll: Core.DiceSpecification;
  speed: number;

  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;

  passivePerception: number;

  constructor() {
    super();

    this.size = Fifth.Size.Medium;
    this.type = Fifth.CreatureType.Humanoid;

    this.armorClass = 10;
    this.hitPointsRoll = Core.DiceGenerator.parse('2d6');

    this.speed = 30;

    this.strength = 10;
    this.dexterity = 10;
    this.constitution = 10;
    this.intelligence = 10;
    this.wisdom = 10;
    this.charisma = 10;

    this.passivePerception = 10;
  }
}

export class Creature extends Core.Component<CreatureParameters> {
  constructor() {
    super(new CreatureParameters());
  }

  async onCreate(ctx: Core.Context) {
    throw new Error('Method not implemented.');
  }
}

Core.Reflect.embed(module);