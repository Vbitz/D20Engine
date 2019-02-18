import * as repl from 'repl';
import * as vm from 'vm';

import * as DiscordBot from './discordBot';

export async function botReplMain(args: string[]) {
  class ReplBackend extends DiscordBot.BotBackend {
    async start(): Promise<void> {}

    async stop(): Promise<void> {}

    async reply(
        from: DiscordBot.MessageFrom, message: string,
        target: DiscordBot.ReplyTarget): Promise<void> {
      console.log('>', message);
    }

    async replyRich(
        from: DiscordBot.MessageFrom,
        embed: DiscordBot.DiscordRichMessage): Promise<void> {
      console.log('>', embed);
    }
  }

  class ReplMessageFrom extends DiscordBot.MessageFrom {
    isDirectMessage(): boolean {
      return false;
    }
    isUserInServer(serverID: string): boolean {
      return true;
    }
    channelMatches(channelID: string): boolean {
      return true;
    }
    getUsername(): string {
      return 'Console';
    }
    getUserId(): string {
      return '1';
    }
    getChannelId(): string {
      return '';
    }
  }

  const backend = new ReplBackend();

  const bot = new DiscordBot.D20Bot(
      {
        token: '',
        oauth2_client_id: '',
        prefix: 'd20 ',
        channelLock: '',
        directMessageLock: ''
      },
      backend);

  await bot.init();

  const server = repl.start({
    prompt: '> ',
    eval:
        (evalCmd: string, context: vm.Context, file: string,
         // tslint:disable-next-line:no-any
         cb: (err: Error|null, result: any) => void) => {
          backend.emit('message', {
            from: new ReplMessageFrom(),
            message: evalCmd.substr(0, evalCmd.length - 1)
          });

          cb(null, undefined);
        }
  });

  await bot.run();

  return 0;
}