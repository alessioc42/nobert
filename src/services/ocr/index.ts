let ocr: any = null;

export type TextLine = {
    mean: number;
    text: string;
    box: number[][];
};

export async function getOcr() {
    if (!ocr) {
        const Ocr = (await import('@gutenye/ocr-node')).default;
        ocr = await Ocr.create();
    }
    return ocr;
}
