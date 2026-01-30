import { type Message } from "discord.js";
import config from "../../config";
import { defaultOllamaQueue } from "../../services/llm/index";
import type { Blob } from "node:buffer";
import { defaultKnowledgebase } from "../../database/knowledgebase";
import sharp from "sharp";

export default {
    name: "postWatcher",
    canHandle: (message: Message): boolean => {
        // @ts-expect-error -- parentId is not in the type definitions, but it exists at runtime
        const parentId = message.channel["parentId"];

        const parentIds = config.KNOWLEDGEBASE_CHANNEL_IDS?.split(",") || [];

        return parentIds.includes(message.channelId) || parentIds.includes(parentId);
    },
    handler: async (message: Message) => {        
        let indexingString = `${message.content}`.trim();

        for (const attachment of message.attachments.values().filter(att => att.contentType?.startsWith("image/"))) {
            try {
                const description = await extractImageDescription(attachment.url);
                indexingString += ` ${description}`;
            } catch (error) {
                console.error(`Error extracting image description for attachment ${attachment.url}:`, error);
            }
        }

        defaultKnowledgebase.updatePost({
            author: message.author.tag,
            authorDisplayName: message.author.displayName,
            text: indexingString,
            hasImage: message.attachments.size > 0,
            messagePath: {
                guildId: BigInt(message.guild!.id),
                channelId: BigInt(message.channelId),
                messageId: BigInt(message.id),
            }
        })
    },
}

const systemPrompt = 
`Du bist ein Bildersuchmaschinen-Indexing-Bot.
Anhand eines Bildes gibst du Stichwörter zurück, die dieses Bild beschreiben. Handelt es sich um Text, gib den Text zurück. Handelt es sich um Mathematik, so gebe Stichwörter zu der Mathematik zurück, beispielsweise Verfahrensfragen. Maximal 10 Stichwörter.

Gebe keine strukturierte Antwort aus. Den Text, sofern vorhanden, zuerst und anschließend pro Zeile die Stichwörter. Trenne diese beiden Bereiche nicht durch Text. Antworte nur auf Deutsch.`;

async function extractImageDescription(attachmentURL: string): Promise<string> {
    const image = await fetch(attachmentURL);
    const blob: Blob = await image.blob();
    const imageSharp = await sharp(Buffer.from(await blob.arrayBuffer())).png().toBuffer();
    
    const description = await defaultOllamaQueue.chat({
        messages: [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content: "Describe the content of this image in a concise sentence.",
                images: [imageSharp.toString('base64')]
            }
        ]
    })
    return description.message.content.split('\n').map(line => line.trim()).filter(line => line.length > 0).join(' ');
}
