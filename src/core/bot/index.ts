import * as Core from 'core';
import * as Discord from 'discord.io';
import {readFileSync} from 'fs';

export interface DiscordBotConfig {
  token: string;
  oauth2_client_id: string;
  prefix: string;
  channelLock: string;
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

interface Command {
  helpText: string;
  callback: CommandCallback;
}

enum ReplyTarget {
  Channel,
  User
}

export class DiscordBot {
  private bot: Discord.Client;

  private commands: Map<string, Command> = new Map();

  private exitPromise: Promise<void>;
  private exitCallback: () => void = () => {};

  constructor(private config: DiscordBotConfig) {
    this.bot = new Discord.Client({token: config.token, autorun: false});

    this.addCommand('ping', 'PONG!', async (from, msg) => {
      await this.reply(from, 'PONG!');
    });

    this.addCommand(
        'restart', '[BOT_ADMIN] Restart and update the bot.',
        async (from, msg) => {
          this.validateAdmin(from);

          await this.reply(from, 'Restarting Now');

          this.exitCallback();
        });

    this.addCommand('help', 'This command...', async (from, msg) => {
      let ret = '**D20Engine Help: **\n';

      for (const [name, command] of this.commands.entries()) {
        ret += `${this.config.prefix}${name}: ${command.helpText}\n`;
      }

      await this.reply(from, ret, ReplyTarget.User);
    });

    this.addCommand(
        'source', 'https://github.com/Vbitz/D20Engine', async (from, msg) => {
          await this.reply(
              from,
              'Source is available at: https://github.com/Vbitz/D20Engine',
              ReplyTarget.User);
        });

    this.exitPromise = new Promise((res, rej) => {
      this.exitCallback = () => {
        res();
      };
    });
  }

  addCommand(name: string, helpText: string, cb: CommandCallback) {
    this.commands.set(name, {helpText, callback: cb});
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
      user: string, userID: string, channelID: string, _message: string) {
    if (channelID !== this.config.channelLock) {  // vbitz#botspam
      return;
    }

    const from = {user, userID, channelID} as MessageFrom;

    if (!_message.startsWith(this.config.prefix)) {
      // Not something sent to the bot.
      return;
    }

    const message = _message.substr(this.config.prefix.length);

    console.log(message);

    const commandRegex = /([a-zA-Z0-9_]+)(.*)/;

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
      await this.commands.get(commandName)!.callback.call(this, from, rest);
    } catch (ex) {
      if (ex instanceof PermissionDeniedError) {
        await this.reply(from, `Command not found: ${commandName}`);
        return;
      } else {
        await this.reply(from, 'Internal Error!');
      }
    }
  }
  protected reply(
      from: MessageFrom, message: string,
      target = ReplyTarget.Channel): Promise<void> {
    return new Promise((res, rej) => {
      console.log('>', from.userID, message);

      const bot = this.bot;

      const generator = this.paginateMessage(message);

      function callback() {
        const next = generator.next();

        if (next.done) {
          res();
        } else {
          if (target === ReplyTarget.Channel) {
            bot.sendMessage(
                {to: from.channelID, message: next.value}, callback);
          } else if (target === ReplyTarget.User) {
            bot.sendMessage({to: from.userID, message: next.value}, callback);
          }
        }
      }

      callback();
    });
  }

  protected validateAdmin(from: MessageFrom) {
    if (from.userID !== '125800047173566464') {  // Vbitz
      throw new PermissionDeniedError('This requires admin privileges.');
    }
  }

  /**
   * Implementation from:
   * https://stackoverflow.com/questions/49205298/sending-2-different-messages-if-message-exceeds-2000-characters
   * Thanks @Zizzeren#2687 for the suggestion.
   * @param message The message to split up.
   */
  private * paginateMessage(message: string): IterableIterator<string> {
    // TODO(joshua): Improve the splitting point.

    for (let i = 0; i < message.length; i += 2000) {
      const toSend = message.substring(i, Math.min(message.length, i + 2000));
      yield toSend;
    }
  }
}

export class D20DiscordBot extends DiscordBot {
  private diceGenerator = new Core.Dice.DiceGenerator(() => Math.random());

  constructor(config: DiscordBotConfig) {
    super(config);

    this.addCommand(
        'roll', 'Rolls arbitrary dice. Try `roll drop(4d6,-1)`.',
        this.commandRoll);
    this.addCommand(
        'randchar', 'Rolls a random character', this.commandRandChar);
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

    await this.reply(
        from, `Result: ${Core.Dice.DiceGenerator.explain(results)}`);
  }

  async commandRandChar(from: MessageFrom, message: string) {
    await this.reply(from, `
**Strength**:     ${this.diceGenerator.parseAndExplain('drop(4d6,-1)')}
**Dexterity**:    ${this.diceGenerator.parseAndExplain('drop(4d6,-1)')}
**Constitution**: ${this.diceGenerator.parseAndExplain('drop(4d6,-1)')}
**Intelligence**: ${this.diceGenerator.parseAndExplain('drop(4d6,-1)')}
**Wisdom**:       ${this.diceGenerator.parseAndExplain('drop(4d6,-1)')}
**Charisma**:     ${this.diceGenerator.parseAndExplain('drop(4d6,-1)')}
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
