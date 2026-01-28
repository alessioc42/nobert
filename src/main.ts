import { Client, Collection, Events, GatewayIntentBits } from "discord.js";

import { token } from "../token.json";
import setupMessageWatcher from "./watchers";
import setupCommands from "./commands";
import { defaultMemeBase } from "./memebase/database";

declare module "discord.js" {
  interface Client {
    commands: Collection<string, unknown>;
  }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages] });

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.commands = new Collection();
setupCommands(client);

setupMessageWatcher(client);

process.on("SIGINT", () => {
  console.log("Received SIGINT. Shutting down...");
  client.destroy();
  defaultMemeBase.close();
  process.exit();
});

client.login(token);

