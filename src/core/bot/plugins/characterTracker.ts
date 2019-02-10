import * as Core from 'core';
import {join} from 'path';

import * as DiscordBot from '../discordBot';

export class Character {
  name = 'Player';
  level = 1;
  currentHitPoints = 5;
  maximumHitPoints = 5;
  currentCopper = 0;
  currentSpellSlots: Core.Common.Bag<string> = {};

  constructor(private characterPath: string) {}

  async save() {
    await Core.Common.writeFile(
        this.characterPath, JSON.stringify({
          name: this.name,
          level: this.level,
          currentHitPoints: this.currentHitPoints,
          maximumHitPoints: this.maximumHitPoints,
          currentCopper: this.currentCopper,
          currentSpellSlots: this.currentSpellSlots
        }),
        'utf8');
  }

  // tslint:disable-next-line:no-any
  async load(data: any) {
    if (data['name'] !== undefined && typeof (data['name']) === 'string') {
      this.name = data['name'];
    }

    if (data['level'] !== undefined && typeof (data['level']) === 'number') {
      this.level = data['level'];
    }

    if (data['currentHitPoints'] !== undefined
        && typeof (data['currentHitPoints']) === 'number') {
      this.currentHitPoints = data['currentHitPoints'];
    }

    if (data['maximumHitPoints'] !== undefined
        && typeof (data['maximumHitPoints']) === 'number') {
      this.maximumHitPoints = data['maximumHitPoints'];
    }

    if (data['currentCopper'] !== undefined
        && typeof (data['currentCopper']) === 'number') {
      this.currentCopper = data['currentCopper'];
    }

    if (data['currentSpellSlots'] !== undefined
        && typeof (data['currentSpellSlots']) === 'object') {
      this.currentSpellSlots = data['currentSpellSlots'];
    }
  }
}

const PLUGIN_PATH = join('plugin', 'characterTracker');

export class CharacterTracker extends DiscordBot.BotPlugin {
  constructor(owner: DiscordBot.Bot) {
    super(owner, 'ct');

    const self = this;

    const hpTracker = this.getSubCommand('hp');

    hpTracker.addCommand(
        'maxHp', 'Get/Set the maximum HP for your Character',
        async function(from, msg) {
          const character = await await self.getCharacter(this.getUserID(from));
          if (msg.trim().length === 0) {
            const maximumHitPoints = character.maximumHitPoints;

            await this.reply(from, `Maximum HitPoints: ${maximumHitPoints}`);
          } else {
            const newValue = Number.parseInt(msg.trim(), 10);

            character.maximumHitPoints = newValue;

            await character.save();
          }
        });
  }

  private async getCharacter(userId: string): Promise<Character> {
    const savePath = await Core.getSavePath();

    await Core.Common.ensurePath(join(savePath, PLUGIN_PATH));

    const characterFile = `${await Core.Common.hashString(userId)}.json`;

    const characterPath = join(savePath, PLUGIN_PATH, characterFile);

    const newCharacter = new Character(characterPath);

    if (!(await Core.Common.fileExists(characterPath))) {
      return newCharacter;
    }

    const content = await Core.Common.readFile(characterPath, 'utf8');

    const contentObject = JSON.parse(content);

    await newCharacter.load(contentObject);

    return newCharacter;
  }
}