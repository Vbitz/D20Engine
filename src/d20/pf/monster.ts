import * as Core from 'core';
import * as PF from 'd20/pf';

export class MonsterParameters {
  static importFromDatabase(monster: PF.Database.Monster): MonsterParameters {
    const newParams = new MonsterParameters();

    const abilityScoreRegex =
        /Str +([-0-9]+), +Dex +([-0-9]+), +Con +([-0-9]+), +Int +([-0-9]+), +Wis +([-0-9]+), +Cha +([-0-9]+)/;

    const scores = abilityScoreRegex.exec(monster.AbilityScores);

    if (scores === null) {
      console.log(monster.Name, monster.AbilityScores);
    } else {
      const [str, dex, con, int, wis, cha] = Array.of(...scores).slice(1).map(
          (a) => a === '-' ? undefined : Number.parseInt(a, 10));

      console.log(monster.Name, str, dex, con, int, wis, cha);
    }

    return newParams;
  }
}

export async function monsterImportMain(args: string[]) {
  const game = new Core.Game();

  await game.contextCall(async (ctx) => {
    const ent = ctx.createEntity();

    await ent.addComponent(ctx, new PF.DatabaseLookup());

    const monsters =
        await ctx.callEvent(ent, PF.DatabaseLookup.getMonsters).call();

    if (monsters === undefined) {
      throw new Error('Not Implemented');
    }

    for (const monster of monsters) {
      const newParams = MonsterParameters.importFromDatabase(monster);
    }
  });

  return 0;
}