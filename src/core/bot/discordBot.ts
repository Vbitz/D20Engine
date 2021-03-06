import * as Core from 'core';
import * as shlex from 'core/third_party/shlex';
import * as Discord from 'discord.io';
import {EventEmitter} from 'events';

export interface DiscordBotConfig {
  token: string;
  oauth2_client_id: string;
  prefix: string;
  channelLock: string;
  directMessageLock: string;
}

const PERMISSIONS_INT = 2048;

export abstract class MessageFrom {
  prefix = '';

  abstract channelMatches(channelID: string): boolean;
  abstract getUsername(): string;
  abstract getUserId(): string;
  abstract getChannelId(): string;
  abstract isDirectMessage(): boolean;
  abstract isUserInServer(serverID: string): boolean;
}

export class DiscordMessageFrom extends MessageFrom {
  constructor(
      private owner: DiscordBot, public directMessage: boolean,
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

  isDirectMessage(): boolean {
    return this.directMessage;
  }

  isUserInServer(serverID: string): boolean {
    return this.owner.isUserInServer(this.userID, serverID);
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
  supportsTopLevel: boolean;
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

        ret += `${from.prefix}${name}: ${command.helpText}\n`;
      }

      await this.reply(from, ret, ReplyTarget.User);
    });
  }

  addCommand(
      name: string, helpText: string|undefined, cb: CommandCallback,
      supportsTopLevel = false) {
    this.commands.set(name, {helpText, callback: cb, supportsTopLevel});
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

  getCommandSupportsTopLevel(commandName: string) {
    if (!this.commands.has(commandName)) {
      return false;
    }

    return this.commands.get(commandName)!.supportsTopLevel;
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

  // This API will be generalized
  abstract replyRich(from: MessageFrom, embed: DiscordRichMessage):
      Promise<void>;

  on(id: 'message',
     cb: (evt: {from: MessageFrom, message: string}) => void): this {
    super.on(id, cb);
    return this;
  }
}

export interface DiscordRichMessage {
  author?: {icon_url?: string, name: string, url?: string};
  color?: number;
  description?: string;
  fields?: [{name: string, value?: string, inline?: boolean}];
  thumbnail?: {url: string};
  title: string;
  timestamp?: Date;
  url?: string;
  footer?: {icon_url?: string, text: string};
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

  replyRich(from: MessageFrom, embed: DiscordRichMessage): Promise<void> {
    return new Promise((res, rej) => {
      if (!(from instanceof DiscordMessageFrom)) {
        rej(new Error('Not implemented'));
        return;
      }

      console.log('>', from.getUsername(), embed);

      const bot = this.bot;

      bot.sendMessage({to: from.channelID, embed}, () => {
        res();
      });
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
      this.emit('message', {
        from: new DiscordMessageFrom(
            this, channelID in this.bot.directMessages, user, userID,
            channelID),
        message
      });
    });

    this.bot.on('disconnect', () => {
      process.exit(0);
    });
  }

  async stop() {
    this.bot.disconnect();
  }

  isUserInServer(userID: string, serverID: string) {
    console.log(serverID, serverID in this.bot.servers);
    return serverID in this.bot.servers
        && userID in this.bot.servers[serverID].members;
  }

  /**
   * Implementation from:
   * https://stackoverflow.com/questions/49205298/sending-2-different-messages-if-message-exceeds-2000-characters
   * Thanks @Zizzeren#2687 for the suggestion.
   * @param message The message to split up.
   */
  private * paginateMessage(message: string): IterableIterator<string> {
    // TODO(joshua): Improve the splitting point.

    for (let i = 0; i < message.length;) {
      let toSend = '';
      const sendString =
          message.substring(i, Math.min(message.length, i + 2000));
      if (sendString.lastIndexOf('\n') > 1800) {
        const lastIndex = sendString.lastIndexOf('\n');
        toSend = message.substring(i, Math.min(message.length, i + lastIndex));
        i += lastIndex;
      } else {
        toSend = sendString;
        i += 2000;
      }
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

    this.addCommand(
        'version', 'Print the current version hash.',
        async function(from, msg) {
          await this.reply(
              from, `Current Version: ${await Core.getVersion()}`,
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
    if (from.isDirectMessage()
        && from.isUserInServer(this.config.directMessageLock)) {
      const split = this.splitMessage(_message);

      if (split === undefined) {
        return;
      }

      const [_, name, rest] = split;

      from.prefix = '';

      await this.executeCommand(from, split);

      return;
    }

    if (!from.channelMatches(this.config.channelLock)) {  // vbitz#botspam
      return;
    }

    if (_message.startsWith(this.config.prefix)) {
      const message = _message.substr(this.config.prefix.length);

      const split = this.splitMessage(message);

      if (split === undefined) {
        return;
      }

      from.prefix = this.config.prefix;

      await this.executeCommand(from, split);
    } else {
      // Support commands that can be executed without the normal prefix.

      // TODO(joshua): This should be set per server.

      const split = this.splitMessage(_message);

      if (split === undefined) {
        return;
      }

      const [_, name, rest] = split;

      if (!this.getCommandSupportsTopLevel(name)) {
        // Not something sent to the bot.
        return;
      }

      from.prefix = '';

      await this.executeCommand(from, split);
    }
  }

  private splitMessage(message: string): [string, string, string]|undefined {
    const commandRegex = /([a-zA-Z0-9_]+)(.*)/;

    const commandResults = commandRegex.exec(message);

    if (commandResults === null) {
      // Not something sent to the bot.
      return undefined;
    }

    const [_, name, rest] =
        Array.of(...commandResults) as [string, string, string];

    return [_, name, rest];
  }

  private async executeCommand(from: MessageFrom, [_, name, rest]: [
    string, string, string
  ]) {
    console.log(
        '<', `${from.getUsername()}$${from.getUserId()}`,
        from.isDirectMessage() ? 'DIRECT' : from.getChannelId(), [name, rest]);

    const result = await this.runCommand(this, from, [_, name, rest]);
  }
}

export class D20RPCContext extends Core.RPC.Context {
  constructor(private bot: D20Bot, private from: MessageFrom) {
    super();
  }

  async reply(text: string): Promise<void> {
    return await this.bot.reply(this.from, text);
  }

  async replyUser(text: string): Promise<void> {
    return await this.bot.reply(this.from, text);
  }

  getUserID(): string {
    return this.from.getUserId();
  }

  async validateAdmin(): Promise<void> {
    this.bot.validateAdmin(this.from);
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
    this.addCommand('pf', '(BETA) Pathfinder Tools', this.commandPf, true);
    this.addCommand('graph', undefined, this.commandGraph);
  }

  async init() {
    const PF = await import('d20/pf');

    await this.game.registerModule(new PF.RootModule());

    this.rpcServer = await this.game.contextCall(async (ctx) => {
      const controllerEntity = ctx.createEntity();

      await controllerEntity.addComponent(ctx, new PF.Controller());

      return this.game.createRPCServer(controllerEntity);
    });
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
    const chain = shlex.split(message);

    try {
      await this.rpcServer!.execute(new D20RPCContext(this, from), chain);
    } catch (err) {
      if (err instanceof Core.RPC.MarshalNotFoundError) {
        return;
      } else if (err instanceof Core.RPC.MarshalUsageError) {
        await this.reply(from, `Error: ${err.message}`, ReplyTarget.User);
      } else {
        this.reportError(err);
      }
    }
  }

  async commandGraph(from: MessageFrom, message: string) {
    this.validateAdmin(from);

    this.reply(
        from, `\`\`\`\n${this.game.generateEventGraph()}\n\`\`\``,
        ReplyTarget.User);
  }
}
