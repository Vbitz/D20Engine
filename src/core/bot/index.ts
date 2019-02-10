import {readFileSync} from 'fs';

import {D20Bot, DiscordBot} from './discordBot';
// import {CharacterTracker} from './plugins/characterTracker';

export async function botMain(args: string[]) {
  const config = JSON.parse(readFileSync(__dirname + '/config.json', 'utf8'));
  const discordBot = new D20Bot(config, new DiscordBot(config.token));

  // discordBot.addPlugin(new CharacterTracker(discordBot));

  if (args[0] === 'auth') {
    console.log(discordBot.authURL());
  } else {
    await discordBot.run();
  }

  return 0;
}