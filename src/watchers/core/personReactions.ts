import type { Message } from "discord.js";
import configModule from "../../config";

const userReacts: Record<string, string[]> = JSON.parse(configModule.USER_AUTO_REACT_JSON ?? "{}");

export default {
    name: "personReactor",
    canHandle: (message: Message): boolean => {
        return message.author.id in userReacts;
    },
    handler: async (message: Message) => {
        const reactions = userReacts[message.author.id] ?? [];
        for (const reaction of reactions) {
            await message.react(reaction);
        }
    },
}
