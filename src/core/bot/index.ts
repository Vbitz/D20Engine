import * as Core from 'core';
import {existsSync, readFileSync} from 'fs';
import {join} from 'path';

import {D20Bot, DiscordBot} from './discordBot';

// import {CharacterTracker} from './plugins/characterTracker';

export async function botMain(args: string[]) {
  let configPath = __dirname + '/config.json';

  if (!existsSync(configPath)) {
    configPath = join(await Core.getConfigPath(), 'bot.json');
  }

  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  const discordBot = new D20Bot(config, new DiscordBot(config.token));

  await discordBot.init();

  // discordBot.addPlugin(new CharacterTracker(discordBot));

  if (args[0] === 'auth') {
    console.log(discordBot.authURL());
  } else {
    await discordBot.run();
  }

  return 0;
}