import * as Core from 'core';
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

export interface CreatureParameters extends Core.ComponentParameters {
  size: Fifth.Size;
  type: Fifth.CreatureType;

  armorClass: number;
  hitPointsRoll: string;
  speed: number;

  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;

  passivePerception: number;
}

export class Creature extends Core.Component<CreatureParameters> {
  async onCreate(ctx: Core.Context) {
    throw new Error('Method not implemented.');
  }
}