import { Client, Events } from "discord.js";
import type { Message } from "discord.js";

import memeWatcher from "./core/memeWatcher";
import frenchWatcher from "./core/french";


// list of handlers by priority. At most one handler will be executed per message
const handlers: {
  name: string;
  canHandle: (message: Message) => boolean;
  handler: (message: Message) => Promise<void>;
}[] = [
  memeWatcher,
  frenchWatcher
];

function setupMessageWatcher(client: Client) {
  client.on(Events.MessageCreate, async (message: Message) => {
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
