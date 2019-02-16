import * as Core from 'core';
import * as shlex from 'core/third_party/shlex';
import * as Discord from 'discord.io';
import {EventEmitter} from 'events';

export interface DiscordBotConfig {
  token: string;
  oauth2_client_id: string;
  prefix: string;
  channelLock: string;
}

const PERMISSIONS_INT = 2048;

export abstract class MessageFrom {
  abstract channelMatches(channelID: string): boolean;
  abstract getUsername(): string;
  abstract getUserId(): string;
  abstract getChannelId(): string;
}

export class DiscordMessageFrom extends MessageFrom {
  constructor(
      public user: string, public userID: string, public channelID: string) {
    super();
  }

  channelMatches(channelID: string): boolean {
    return this.channelID === channelID;
  }

  getUserId() {
    return this.userID;
  }

  getUsername() {
    return this.user;
  }

  getChannelId(): string {
    return this.channelID;
  }
}

export type CommandCallback = (this: Bot, from: MessageFrom, message: string) =>
    Promise<void>;

export class PermissionDeniedError extends Error {
  constructor(readonly subMessage: string) {
    super(`PermissionDenied - ${subMessage}`);
  }
}

interface Command {
  helpText: string|undefined;
  callback: CommandCallback;
}

export enum ReplyTarget {
  Channel,
  User
}

export class CommandHandler {
  private commands: Map<string, Command> = new Map();

  constructor() {
    this.addCommand('help', 'This command...', async function(from, msg) {
      let ret = '**D20Engine Help: **\n';

      for (const [name, command] of this.commands.entries()) {
        if (command.helpText === undefined) {
          continue;
        }

        ret += `${this.config.prefix}${name}: ${command.helpText}\n`;
      }

      await this.reply(from, ret, ReplyTarget.User);
    });
  }

  addCommand(name: string, helpText: string|undefined, cb: CommandCallback) {
    this.commands.set(name, {helpText, callback: cb});
  }

  async runCommand(owner: Bot, from: MessageFrom, [_, commandName, rest]: [
    string, string, string
  ]): Promise<boolean|undefined> {
    if (!this.commands.has(commandName)) {
      return false;
    }

    try {
      await this.commands.get(commandName)!.callback.call(owner, from, rest);
      return true;
    } catch (ex) {
      if (ex instanceof PermissionDeniedError) {
        return false;
      } else {
        await owner.reportError(ex);
        await owner.reply(from, 'Internal Error!');
        return undefined;
      }
    }
  }

  protected getSubCommand(name: string): CommandHandler {
    throw new Error('Not Implemented');
  }
}

export abstract class BotPlugin extends CommandHandler {
  constructor(protected owner: Bot, public prefix: string) {
    super();
  }
}

export abstract class BotBackend extends EventEmitter {
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;

  abstract reply(from: MessageFrom, message: string, target: ReplyTarget):
      Promise<void>;

  on(id: 'message',
     cb: (evt: {from: MessageFrom, message: string}) => void): this {
    super.on(id, cb);
    return this;
  }
}

export class DiscordBot extends BotBackend {
  private bot: Discord.Client;

  constructor(token: string) {
    super();
    this.bot = new Discord.Client({token, autorun: false});
  }

  reply(from: MessageFrom, message: string, target = ReplyTarget.Channel):
      Promise<void> {
    return new Promise((res, rej) => {
      console.log('>', from.getUsername(), message);

      const bot = this.bot;

      const generator = this.paginateMessage(message);

      function callback() {
        if (!(from instanceof DiscordMessageFrom)) {
          throw new Error('Not implemented');
        }

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

  async start() {
    this.bot.connect();

    this.bot.on('ready', () => {
      console.log(
          'Successfully connected: ' + this.bot.username + ' - (' + this.bot.id
          + ')');
    });

    this.bot.on('message', async (user, userID, channelID, message, evt) => {
      this.emit(
          'message',
          {from: new DiscordMessageFrom(user, userID, channelID), message});
    });

    this.bot.on('disconnect', () => {
      process.exit(0);
    });
  }

  async stop() {
    this.bot.disconnect();
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

export class Bot extends CommandHandler {
  private plugins: BotPlugin[] = [];

  private exitPromise: Promise<void>;
  private exitCallback: () => void = () => {};

  constructor(readonly config: DiscordBotConfig, private backend: BotBackend) {
    super();

    this.addCommand('ping', 'PONG!', async function(from, msg) {
      await this.reply(from, 'PONG!');
    });

    this.addCommand('restart', undefined, async function(from, msg) {
      this.validateAdmin(from);

      await this.reply(from, 'Restarting Now');

      this.exitCallback();
    });

    this.addCommand(
        'source', 'https://github.com/Vbitz/D20Engine',
        async function(from, msg) {
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

  addPlugin(plugin: BotPlugin) {
    this.plugins.push(plugin);
  }

  authURL() {
    return `https://discordapp.com/oauth2/authorize?&client_id=${
        this.config.oauth2_client_id}&scope=bot&permissions=${PERMISSIONS_INT}`;
  }

  async reportError(ex: Error) {
    console.error(ex);
  }

  async run() {
    this.backend.on('message', ({from, message}) => {
      this.onMessage(from, message);
    });

    await this.backend.start();

    await this.exitPromise;

    await this.backend.stop();
  }

  validateAdmin(from: MessageFrom) {
    if (from.getUserId() !== '125800047173566464') {  // Vbitz
      throw new PermissionDeniedError('This requires admin privileges.');
    }
  }

  getUserID(from: MessageFrom) {
    return from.getUserId();
  }

  async reply(from: MessageFrom, message: string, target = ReplyTarget.Channel):
      Promise<void> {
    return await this.backend.reply(from, message, target);
  }

  private async onMessage(from: MessageFrom, _message: string) {
    if (!from.channelMatches(this.config.channelLock)) {  // vbitz#botspam
      return;
    }

    // console.log(from, _message);

    if (!_message.startsWith(this.config.prefix)) {
      // Not something sent to the bot.
      return;
    }

    const message = _message.substr(this.config.prefix.length);

    // console.log(message);

    const commandRegex = /([a-zA-Z0-9_]+)(.*)/;

    const commandResults = commandRegex.exec(message);

    if (commandResults === null) {
      // Not something sent to the bot.
      return;
    }

    console.log(
        '<', `${from.getUsername()}$${from.getUserId()}`, from.getChannelId(),
        message);

    const result = await this.runCommand(
        this, from, Array.of(...commandResults) as [string, string, string]);
  }
}

export class D20RPCContext extends Core.RPC.Context {
  constructor(private bot: D20Bot, private from: MessageFrom) {
    super();
  }

  async reply(text: string): Promise<void> {
    return await this.bot.reply(this.from, text);
  }

  getUserID(): string {
    return this.from.getUserId();
  }
}

export class D20Bot extends Bot {
  private diceGenerator = new Core.Dice.DiceGenerator(() => Math.random());

  private game = new Core.Game();

  private rpcServer: Core.RPC.Server|null = null;

  constructor(config: DiscordBotConfig, backend: BotBackend) {
    super(config, backend);

    this.addCommand(
        'roll', 'Rolls arbitrary dice. Try `roll drop(4d6,-1)`.',
        this.commandRoll);
    this.addCommand(
        'randchar', 'Rolls a random character', this.commandRandChar);
    this.addCommand(
        'pf', '(BETA) Pathfinder Character Tracker', this.commandPf);
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

  async commandPf(from: MessageFrom, message: string) {
    if (this.rpcServer === null) {
      const PF = await import('d20/pf');

      this.rpcServer = await this.game.contextCall(async (ctx) => {
        const controllerEntity = ctx.createEntity();

        controllerEntity.addComponent(ctx, new PF.Controller());

        return this.game.createRPCServer(controllerEntity);
      });
    }

    const chain = shlex.split(message);

    await this.rpcServer.execute(new D20RPCContext(this, from), chain);
  }
}
