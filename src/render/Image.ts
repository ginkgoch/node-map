import fs from 'fs';
import { NativeFactory, NativeImage } from '../native';

/**
 * An image wrapper class.
 */
export class Image {
    buffer: Buffer | null;
    width: number;
    height: number;
    source: NativeImage;

    /**
     * Constructs an instance of Image.
     * @param {IArguments} arguments Parameters could be width: number and height: number, or imagePath: string. 
     * 
     * Constructs with width and height:
     * ```typescript
     * const image = new Image(256, 256);
     * ```
     * 
     * Constructs with image file path:
     * ```typescript
     * const image = new Image('demo.png');
     * ```
     */
    constructor(buffer?: Buffer)
    constructor(imageFilePath?: string)
    constructor(width?: number, height?: number)
    constructor(param?: string | number | Buffer, height?: number) {
        this.buffer = null;
        if (typeof param === 'number') {
            this.width = param;
            this.height = height || 256;
            this.source = NativeFactory.nativeImage();
            this.source.src = this.buffer = this._nativeCanvas(this.width, this.height).toBuffer();
        }
        else if (typeof param === 'string') {
            this.source = NativeFactory.nativeImage();
            this.source.src = this.buffer = fs.readFileSync(param);
            this.width = this.source.width;
            this.height = this.source.height;
        }
        else if (param instanceof Buffer) {
            this.source = NativeFactory.nativeImage();
            this.source.src = this.buffer = param;
            this.width = this.source.width;
            this.height = this.source.height;
        }
        else {
            this.width = this.height = 256;
            this.source = NativeFactory.nativeImage();
            this.source.src = this.buffer = this._nativeCanvas(this.width, this.height).toBuffer();
        }
    }

    /**
     * Converts this image to a buffer instance.
     * @returns {Buffer} Buffer from this image.
     */
    toBuffer(): Buffer {
        return this.buffer || this._nativeCanvas(this.width, this.height).toBuffer();
    }

    /**
     * Converts this image to JSON format data.
     * @returns {any} The JSON format data of this image.
     */
    toJSON(): any {
        return {
            type: 'image',
            width: this.width,
            height: this.height,
            buffer: (<Buffer>this.buffer).toJSON()
        }
    }

    private _nativeCanvas(width: number, height: number) {
        return NativeFactory.nativeCanvas(width, height);
    }
}