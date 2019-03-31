import * as Core from 'core';
import * as PF from 'd20/pf';
import * as Game from 'libgame';

export class StatefulTest extends Core.StatefulObject {
  name = 'Hello, World';
  count = 10;
}

async function simpleSaveTest() {
  const st = new StatefulTest();

  st.name = 'Testing';

  st.count = 100;

  console.log('BeforeSave', st.name, st.count);

  const savedObject = st.save();

  const st2 = new StatefulTest();

  st2.load(savedObject);

  console.log('AfterLoad', st2.name, st2.count);
}

async function complexSaveTest() {
  const game = new Core.Game();

  await game.contextCall(async (ctx) => {
    const ent = ctx.createEntity();

    await ent.addComponent(ctx, new PF.Components.Class());

    const saveObject = await ent.save();

    console.log(saveObject);

    const ent2 = ctx.createEntity();

    await ent2.load(ctx, saveObject);
  });
}

export async function saveTestMain(args: string[]) {
  await simpleSaveTest();

  await complexSaveTest();

  return 0;
}

Core.Reflect.embed(module);