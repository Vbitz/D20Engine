import * as Core from 'core';
import * as Fifth from 'd20/fifth';

export async function frontendGeneratorTest(args: string[]) {
  const creatureParams = new Fifth.Creature.CreatureParameters();

  console.log(JSON.stringify(
      {
        'name': 'CreatureParameters',
        'fields': creatureParams.getPublicFields()
      },
      undefined, 2));

  return 0;
}