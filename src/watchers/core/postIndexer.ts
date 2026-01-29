import { type Message } from "discord.js";

export default {
    name: "postWatcher",
    canHandle: (message: Message): boolean => {
        console.log(`Forum-ID ${message.channelId}`);
        console.log(`Guild-ID ${message.guild?.id}`);
        console.log(`Channel-ID ${message.channel.id}`);
        console.log(`Message-ID ${message.id}`);
        console.log(`Assembled Link: https://discord.com/channels/${message.guild?.id}/${message.channelId}/${message.id}`);
        console.log(`Content: ${message.content}`);
        console.log(`Forum title: ${message.channelId}`);
        const key = `${message.guild?.id}/${message.channelId}/${message.id}`;
        console.log(`Encoded Key: ${keyTools.decodeKey(keyTools.encodeKey(Number(message.guild?.id), Number(message.channelId), Number(message.id)))}`);
        return false;
    },
    handler: async (message: Message) => {
        // TODO: Index
    },
}


const keyTools = {
    encodeKey: (guildId: number, channelId: number, messageId: number): string => {
        const toBase64 = (num: number): string => num.toString(36);
        return `${toBase64(guildId)}.${toBase64(channelId)}.${toBase64(messageId)}`;
    },
    decodeKey: (key: string): string => {
        const parts = key.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid key format');
        }
        const fromBase64 = (str: string): string => parseInt(str, 36).toString();
        const strParts = {
            guildId: fromBase64(parts[0]!),
            channelId: fromBase64(parts[1]!),
            messageId: fromBase64(parts[2]!),
        };
        return `${strParts.guildId}/${strParts.channelId}/${strParts.messageId}`;
    }
}
