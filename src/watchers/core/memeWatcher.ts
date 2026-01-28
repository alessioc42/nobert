const COMPRESSION_QUALITY = 60;
const MAX_IMAGE_DIMENSION = 768;

import sharp from "sharp";
import type { Message } from "discord.js";
import { defaultMemeBase } from "../../memebase/database"

let ocr: any = null;

async function getOcr() {
    if (!ocr) {
        const Ocr = (await import('@gutenye/ocr-node')).default;
        ocr = await Ocr.create();
    }
    return ocr;
}

type TextLine = {
    mean: number;
    text: string;
    box: number[][];
};

export default {
    name: "memeWatcher",
    canHandle: (message: Message): boolean => {

        let channel = message.guild?.channels.cache.filter(c => c.name === "memes");
        
        return message.attachments.size > 0;
    },
    handler: async (message: Message) => {
        const imageAttachments = message.attachments.filter((attachment) => {
            return attachment.contentType?.startsWith("image/");
        });
        console.log(`MemeWatcher: Processing ${imageAttachments.size} image attachments from message ${message.id}`);
        for (const attachment of imageAttachments.values()) {
            const response = await fetch(attachment.url);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            console.log(`MemeWatcher: Downloaded image attachment ${attachment.url}, size ${buffer.length} bytes`);
            const ocrInstance = await getOcr();
            const result: TextLine[] = await ocrInstance.detect(buffer);
            console.log(`MemeWatcher: OCR detected ${result.length} text lines`);
            const ftsString = result.filter(line => line.mean > 0.94).map((item: TextLine) => item.text).join(' ');
            defaultMemeBase.addMeme(
                message.author.username,
                message.author.displayName,
                await compressWebp(buffer),
                normalizeTextForFTS(ftsString)
            )
        }
    },
};


async function compressWebp(buffer: Buffer): Promise<Buffer> {
    const image = sharp(buffer);
    const resizedImage = image.resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true
    });
    const webp = await resizedImage.webp({ quality: COMPRESSION_QUALITY });
    return webp.toBuffer();
}

// lowercase, remove numbers and special characters
function normalizeTextForFTS(text: string): string {
    return text.toLowerCase().replace(/[^a-z\s]/g, ' ');
}
