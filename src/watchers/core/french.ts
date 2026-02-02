import type { Message } from "discord.js";

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
        return triggers.some(trigger => message.content.toLowerCase().includes(trigger));
    },
    handler: async (message: Message) => {
        message.react('🇫🇷');
        message.react('🥖');
        message.react('🚷');
    },
}
