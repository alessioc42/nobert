import { Client, Events } from "discord.js";
import type { Message } from "discord.js";

import memeWatcher from "./core/memeWatcher";

const handlers: {
  name: string;
  canHandle: (message: Message) => boolean;
  handler: (message: Message) => Promise<void>;
}[] = [
  memeWatcher,
];

function setupMessageWatcher(client: Client) {
  client.on(Events.MessageCreate, async (message: Message) => {
    for (const handler of handlers) {
      try {
        if (handler.canHandle(message)) {
          await handler.handler(message);
        }
      } catch (error) {
        message.react("🛑");
        console.error(`Error in handler ${handler.name}:`, error);
      }
    }
  });
}

export default setupMessageWatcher;
