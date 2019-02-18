import * as Core from 'core';
import * as Fifth from 'd20/fifth';

export interface CombatArguments {
  /** Should include Fifth.Creature.Creature. */
  source: Core.Entity;

  /** Should include Fifth.Creature.Creature. */
  target: Core.Entity;

  /** Should include Fifth.Component.AttackAction. */
  action: Core.Entity;
}

export interface CombatResults {
  defenseResult: Core.Dice.DiceResults;
  attackResult: Core.Dice.DiceResults;

  hit: boolean;

  damageResult?: Core.Dice.DiceResults;
}

export const runCombat =
    new Core.Event<(args: CombatArguments) => CombatResults>();

export const getCurrentCombatAction = new Core.Event<() => CombatAction>();

export class CombatAction {
  constructor(readonly args: CombatArguments) {}

  async run(ctx: Core.Context): Promise<CombatResults> {
    // TODO(joshua): This will need to be abstracted for spells. This only
    // really works for melee and ranged weapons.

    // Get Armor Class "Roll"
    const defenseRoll =
        await ctx.callEvent(this.args.target, Fifth.Creature.getArmorClass)
            .addPatch(
                Fifth.Combat.Combat.getCurrentCombatAction,
                async () => {
                  return this;
                })
            .call();

    if (defenseRoll === undefined) {
      throw new Error('No defenseRoll returned');
    }

    const attackRoll =
        await ctx
            .callEvent(this.args.action, Fifth.MeleeAttackAction.getAttackRoll)
            .addPatch(
                Fifth.Combat.Combat.getCurrentCombatAction,
                async () => {
                  return this;
                })
            .call();

    if (attackRoll === undefined) {
      throw new Error('No attackRoll returned');
    }

    const defenseResult = ctx.diceGenerator.execute(defenseRoll);

    const attackResult = ctx.diceGenerator.execute(attackRoll);

    // TODO(joshua): Do attacks hit if the results match?
    if (attackResult.value < defenseResult.value) {
      return {hit: false, defenseResult, attackResult};
    }

    const damageRoll =
        await ctx
            .callEvent(this.args.action, Fifth.MeleeAttackAction.getDamageRoll)
            .addPatch(
                Fifth.Combat.Combat.getCurrentCombatAction,
                async () => {
                  return this;
                })
            .call();

    if (damageRoll === undefined) {
      throw new Error('No damageRoll returned');
    }

    const finalDamageRoll =
        await ctx
            .callEvent(
                this.args.target, Fifth.Creature.doDamage,
                {amount: damageRoll, source: this.args.source})
            .addPatch(
                Fifth.Combat.Combat.getCurrentCombatAction,
                async () => {
                  return this;
                })
            .call();

    if (finalDamageRoll === undefined) {
      throw new Error('No finalDamageRoll returned');
    }

    return {
      hit: true,
      defenseResult,
      attackResult,
      damageResult: finalDamageRoll
    };
  }
}

export class CombatModule extends Core.Module {
  async onCreate(ctx: Core.Context) {
    ctx.registerRootHandler(runCombat, async (ctx, args) => {
      const combatAction = new CombatAction(args);

      const results = await combatAction.run(ctx);

      return results;
    });
  }
}