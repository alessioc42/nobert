import type { Message } from "discord.js";
import config from "../../config";

const triggers = [
    "français", "french", "france", "française", "paris", "macron", 
    "république", "baguette", "fromage", "croissant", "bonjour", "au revoir",
    "baguettes", "fromages", "croissants", "bonjours", "au revois",
    "prolog", "merci", "frankreich", "französisch", "franzose", "französin",
    "franzosen", "französinnen"
];

export default {
    name: "frenchWatcher",
    canHandle: (message: Message): boolean => {
        if (message.guild?.id !== config.DISCORD_GUILD_ID) {
            return false;
        }

        return triggers.some(trigger => message.content.toLowerCase().includes(trigger));
    },
    handler: async (message: Message) => {
        message.react('🇫🇷');
        message.react('🥖');
        message.react('🚷');
    },
}
