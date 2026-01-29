import { Client, Events } from "discord.js";
import type { Message } from "discord.js";

import memeIndexer from "./core/memeIndexer";
import frenchWatcher from "./core/french";

import config from "../config";
// import postIndexer from "./core/postIndexer";


// list of handlers by priority. At most one handler will be executed per message
const handlers: {
  name: string;
  canHandle: (message: Message) => boolean;
  handler: (message: Message) => Promise<void>;
}[] = [
  memeIndexer,
  frenchWatcher,
//  postIndexer
];

function setupMessageWatcher(client: Client) {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.guild?.id !== config.DISCORD_GUILD_ID || message.guild?.id === undefined) {
            return false;
        }

    for (const handler of handlers) {
      try {
        if (handler.canHandle(message)) {
          await handler.handler(message);
          break;
        }
      } catch (error) {
        message.react("🛑");
        console.error(`Error in handler ${handler.name}:`, error);
      }
    }
  });
}

export default setupMessageWatcher;
