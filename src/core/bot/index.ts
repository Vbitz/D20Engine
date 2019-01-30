import * as Core from 'core';
import * as Discord from 'discord.io';
import {readFileSync} from 'fs';

export interface DiscordBotConfig {
  token: string;
  oauth2_client_id: string;
}

const PERMISSIONS_INT = 2048;

interface MessageFrom {
  user: string;
  userID: string;
  channelID: string;
}

type CommandCallback = (this: DiscordBot, from: MessageFrom, message: string) =>
    Promise<void>;

class PermissionDeniedError extends Error {
  constructor(readonly subMessage: string) {
    super(`PermissionDenied - ${subMessage}`);
  }
}

export class DiscordBot {
  private bot: Discord.Client;

  private commands: Map<string, CommandCallback> = new Map();

  private exitPromise: Promise<void>;
  private exitCallback: () => void = () => {};

  constructor(private config: DiscordBotConfig) {
    this.bot = new Discord.Client({token: config.token, autorun: false});

    this.addCommand('ping', async (from, msg) => {
      await this.reply(from, 'PONG!');
    });

    this.addCommand('restart', async (from, msg) => {
      this.validateAdmin(from);

      await this.reply(from, 'Restarting Now');

      this.exitCallback();
    });

    this.exitPromise = new Promise((res, rej) => {
      this.exitCallback = () => {
        res();
      };
    });
  }

  addCommand(name: string, cb: CommandCallback) {
    this.commands.set(name, cb);
  }

  authURL() {
    return `https://discordapp.com/oauth2/authorize?&client_id=${
        this.config.oauth2_client_id}&scope=bot&permissions=${PERMISSIONS_INT}`;
  }

  async run() {
    this.bot.connect();

    this.bot.on('ready', () => {
      console.log(
          'Successfully connected: ' + this.bot.username + ' - (' + this.bot.id
          + ')');
    });

    this.bot.on('message', async (user, userID, channelID, message, evt) => {
      await this.onMessage(user, userID, channelID, message);
    });

    this.bot.on('disconnect', () => {
      process.exit(0);
    });

    await this.exitPromise;

    this.bot.disconnect();
  }

  private async onMessage(
      user: string, userID: string, channelID: string, message: string) {
    if (channelID !== '536475760479698946') {  // vbitz#botspam
      return;
    }

    const from = {user, userID, channelID} as MessageFrom;

    const commandRegex = /\!([a-zA-Z0-9_]+)(.*)/;

    const commandResults = commandRegex.exec(message);

    if (commandResults === null) {
      // Not something sent to the bot.
      return;
    }

    console.log('<', `${user}$${userID}`, channelID, message);

    const [_, commandName, rest] = commandResults;

    if (!this.commands.has(commandName)) {
      await this.reply(from, `Command not found: ${commandName}`);
      return;
    }

    try {
      await this.commands.get(commandName)!.call(this, from, rest);
    } catch (ex) {
      if (ex instanceof PermissionDeniedError) {
        await this.reply(from, `Permission Denied - ${ex.subMessage}!!`);
      } else {
        await this.reply(from, 'Internal Error!');
      }
    }
  }

  protected reply(from: MessageFrom, message: string): Promise<void> {
    return new Promise((res, rej) => {
      console.log('>', from.channelID, message);
      this.bot.sendMessage({to: from.channelID, message}, () => {
        res();
      });
    });
  }

  protected validateAdmin(from: MessageFrom) {
    if (from.userID !== '125800047173566464') {  // Vbitz
      throw new PermissionDeniedError('This requires admin privileges.');
    }
  }
}

export class D20DiscordBot extends DiscordBot {
  private diceGenerator = new Core.Dice.DiceGenerator(() => Math.random());

  constructor(config: DiscordBotConfig) {
    super(config);

    this.addCommand('roll', this.commandRoll);
    this.addCommand('randchar', this.commandRandChar);
  }

  async commandRoll(from: MessageFrom, message: string) {
    let spec;

    const specString = message.trim();

    if (specString.length > 100) {
      await this.reply(
          from,
          `Specification length is above threshold: ${specString.length} > ${
              100}`);
      return;
    }

    try {
      spec = Core.Dice.DiceGenerator.parse(specString);
    } catch (ex) {
      if (ex instanceof Error) {
        await this.reply(from, `Error: ${ex.message}`);
      } else {
        await this.reply(from, `Internal Error`);
      }

      return;
    }

    const complexity = Core.Dice.DiceGenerator.getComplexity(spec);

    if (complexity > 500) {
      await this.reply(
          from, `Complexity is above threshold: ${complexity} > ${500}`);
      return;
    }

    console.log('Rolling', spec);

    const results = this.diceGenerator.execute(spec);

    await this.reply(from, `Result: ${results.value}`);
  }

  async commandRandChar(from: MessageFrom, message: string) {
    await this.reply(from, `
**Strength**:     ${this.diceGenerator.parseAndExecute('drop(4d6,-1)').value}
**Dexterity**:    ${this.diceGenerator.parseAndExecute('drop(4d6,-1)').value}
**Constitution**: ${this.diceGenerator.parseAndExecute('drop(4d6,-1)').value}
**Intelligence**: ${this.diceGenerator.parseAndExecute('drop(4d6,-1)').value}
**Wisdom**:       ${this.diceGenerator.parseAndExecute('drop(4d6,-1)').value}
**Charisma**:     ${this.diceGenerator.parseAndExecute('drop(4d6,-1)').value}
    `.trim());
  }
}

export async function botMain(args: string[]) {
  const config = JSON.parse(readFileSync(__dirname + '/config.json', 'utf8'));
  const discordBot = new D20DiscordBot(config);

  if (args[0] === 'auth') {
    console.log(discordBot.authURL());
  } else {
    await discordBot.run();
  }

  return 0;
}
