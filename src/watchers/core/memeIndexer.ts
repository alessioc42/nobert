import sharp from "sharp";
import type { Message } from "discord.js";
import { defaultMemeBase } from "../../database/memebase"
import config from "../../config";

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
        if (message.attachments.size === 0) {
            return false;
        }

        let indexingChannelNamesAndIds = config.MEMEBASE_INDEXING_CHANNELS.split(',').map(c => c.trim());

        let memeChannels = message.guild?.channels.cache.filter(c => indexingChannelNamesAndIds.includes(c.name) || indexingChannelNamesAndIds.includes(c.id));

        let foundChannel = false;
        for (let c of memeChannels?.values() || []) {
            if (c.id === message.channel.id) {
                foundChannel = true;
                break;
            }
        }
        
        return foundChannel;
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
                ftsString
            )
            message.react('✅');
        }
    },
};


async function compressWebp(buffer: Buffer): Promise<Buffer> {
    const image = sharp(buffer, { animated: true });
    const resizedImage = image.resize({
        width: config.MEMEBASE_MAX_IMAGE_DIMENSION,
        height: config.MEMEBASE_MAX_IMAGE_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true
    });
    const webp = resizedImage.webp({ quality: config.MEMEBASE_IMAGE_COMPRESSION_QUALITY });
    return await webp.toBuffer();
}
