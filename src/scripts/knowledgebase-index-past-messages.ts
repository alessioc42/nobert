import { Client, Collection, Events, GatewayIntentBits } from "discord.js";

import config from "./../config";
import postIndexer from "../watchers/core/postIndexer";

declare module "discord.js" {
  interface Client {
    commands: Collection<string, unknown>;
  }
}

console.log("Starting Knowledgebase Indexer Script...");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  indexer();
});

process.on("SIGINT", () => {
  console.log("Received SIGINT. Shutting down...");
  client.destroy();
  process.exit();
});

client.on(Events.Error, (error) => {
  console.error("Discord client error:", error);
});

client.login(config.DISCORD_TOKEN);

async function indexer() {
  // Threads
  const server = await client.guilds.fetch(config.DISCORD_GUILD_ID);
  const threads = (await server.channels.fetchActiveThreads()).threads;

  const knowledgebaseChannelIDs = config.KNOWLEDGEBASE_CHANNEL_IDS.split(",");

  for (const [channelID, thread] of threads) {
    if (
      !(knowledgebaseChannelIDs.includes(channelID) ||
        knowledgebaseChannelIDs.includes(thread.parentId!))
    ) {
      continue;
    }
    console.log(
      `Channel ID: ${channelID} - ${thread.name} - ${thread.messageCount} messages`,
    );
    if (thread.messageCount === 0) {
      continue;
    }

    const messages = await thread.messages.fetch({ limit: 100 });
    console.log(`Fetched ${messages.size} messages from thread ${thread.name}`);

    postIndexer.handler = postIndexer.handler.bind(postIndexer);

    for (const message of messages.values()) {
      if (postIndexer.canHandle(message)) {
        await postIndexer.handler(message);
      }
    }
  }

  console.log("Indexing of threads completed. Indexing channels...");

  const channels = await server.channels.fetch();
  for (const [channelID, channel] of channels) {
    if (channel === null) continue;
    if (!knowledgebaseChannelIDs.includes(channelID)) continue;
    if (!channel.isTextBased()) continue;

    const messages = await channel.messages.fetch({ limit: 100 });
    console.log(`Fetched ${messages.size} messages from channel ${channel.name}`);

    for (const message of messages.values()) {
      if (postIndexer.canHandle(message)) {
        await postIndexer.handler(message);
      }
    }

    console.log(
      `Channel ID: ${channelID} - ${channel.name} - Fetching messages...`,
    );
  }

  console.log("Indexing of channels completed. Exiting...");
  client.destroy();
  process.exit();
}
