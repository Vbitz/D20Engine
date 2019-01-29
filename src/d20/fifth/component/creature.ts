import * as Core from 'core';
import {publicField} from 'core/component';
import * as Fifth from 'd20/fifth';

export const getInitiativeRoll: () => Core.DiceSpecification =
    'd20.fifth.component.creature.getInitiativeRoll' as Core.EventDeclaration;

export const getArmorClass: () => Core.DiceSpecification =
    `d20.fifth.component.creature.getArmorClass` as Core.EventDeclaration;

export const getHitPoints: () => Core.DiceSpecification =
    `d20.fifth.component.creature.getHitPoints` as Core.EventDeclaration;

export const isDead: () => boolean =
    `d20.fifth.component.creature.isDead` as Core.EventDeclaration;

export const doTurn: () => void =
    `d20.fifth.component.creature.doTurn` as Core.EventDeclaration;

export const doAttack: (args: {target: Core.Entity}) => void =
    `d20.fifth.component.creature.doAttack` as Core.EventDeclaration;

export interface DamageArguments {
  source: Core.Entity;

  amount: Core.DiceSpecification;
}

export const doDamage: (args: DamageArguments) => Core.Dice.DiceResults =
    `d20.fifth.component.creature.doDamage` as Core.EventDeclaration;

export class CreatureParameters extends Core.ComponentParameters {
  @publicField size: Fifth.Size;
  @publicField type: Fifth.CreatureType;

  @publicField armorClass: number;
  @publicField hitPointsRoll: string;
  @publicField speed: number;

  @publicField strength: number;
  @publicField dexterity: number;
  @publicField constitution: number;
  @publicField intelligence: number;
  @publicField wisdom: number;
  @publicField charisma: number;

  @publicField passivePerception: number;

  constructor() {
    super();

    this.size = Fifth.Size.Medium;
    this.type = Fifth.CreatureType.Humanoid;

    this.armorClass = 10;
    this.hitPointsRoll = '2d6';

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