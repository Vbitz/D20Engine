import * as Core from 'core';

export class StatefulTest extends Core.StatefulObject {
  name = 'Hello, World';
  count = 10;
}

export async function saveTestMain(args: string[]) {
  const st = new StatefulTest();

  st.name = 'Testing';

  st.count = 100;

  console.log('BeforeSave', st.name, st.count);

  const savedObject = st.save();

  const st2 = new StatefulTest();

  st2.load(savedObject);

  console.log('AfterLoad', st2.name, st2.count);

  return 0;
}

Core.Reflect.embed(module);