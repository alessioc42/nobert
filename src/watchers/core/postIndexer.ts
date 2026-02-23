import { messageLink, type Message } from "discord.js";
import config from "../../config";
import { defaultOllamaQueue } from "../../services/llm/index";
import type { Blob } from "node:buffer";
import { defaultKnowledgebase } from "../../database/knowledgebase";
import sharp from "sharp";
import { getOcr, type TextLine } from "../../services/ocr";

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

        const ocrInstance = await getOcr();

        for (const attachment of message.attachments.values().filter(att => att.contentType?.startsWith("image/"))) {
            const image = await fetch(attachment.url);
            const blob: Blob = await image.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const result: TextLine[] = await ocrInstance.detect(buffer);
            console.log(`MemeWatcher: OCR detected ${result.length} text lines`);
            const ocrDetect = result.filter(line => line.mean > 0.94).map((item: TextLine) => item.text).join(' ');

            try {
                const description = await extractImageDescription(blob);
                indexingString += ` ${description} ${ocrDetect}`;
            } catch (error) {
                console.error(`Error extracting image description for attachment ${attachment.url}:`, error);
            }
        }

        defaultKnowledgebase.updatePost({
            author: message.author.tag,
            authorDisplayName: message.member?.displayName || message.author.username,
            text: indexingString,
            hasImage: message.attachments.size > 0,
            timestamp: message.createdAt,
            messageURL: message.url,
        })
    },
}

const systemPrompt = 
`Du bist ein Bildersuchmaschinen-Indexing-Bot.
Anhand eines Bildes gibst du Stichwörter zurück, die dieses Bild beschreiben. Handelt es sich um Mathematik, so gebe Stichwörter zu der Mathematik zurück, beispielsweise Verfahrensfragen. Maximal 10 Stichwörter.

Gebe keine strukturierte Antwort aus. Den Text, sofern vorhanden, zuerst und anschließend pro Zeile die Stichwörter. Trenne diese beiden Bereiche nicht durch Text. Antworte nur auf Deutsch.`;

async function extractImageDescription(blob: Blob): Promise<string> {
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
