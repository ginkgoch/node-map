import fs from 'fs';
import { NativeFactory, NativeImage } from '../native';

/**
 * An image wrapper class.
 * @class
 */
export class Image {
    buffer: Buffer | null;
    width: number;
    height: number;
    source: NativeImage;

    /**
     * Constructs an instance of Image.
     * @constructor
     * @param {IArguments} arguments Parameters could be width: number and height: number, or imagePath: string. 
     * @example
     * // construct with width and height
     * const image = new Image(256, 256)
     * @example
     * // construct with image file path
     * const image = new Image('demo.png')
     */
    constructor(imageFilePath?: string)
    constructor(width?: number, height?: number)
    constructor(param?: string | number, height?: number) {
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
        else {
            this.width = this.height = 256;
            this.source = NativeFactory.nativeImage();
            this.source.src = this.buffer = this._nativeCanvas(this.width, this.height).toBuffer();
        }
    }

    /**
     * Converts image to a buffer instance.
     * @returns {Buffer} Buffer from this image.
     */
    toBuffer(): Buffer {
        return this.buffer || this._nativeCanvas(this.width, this.height).toBuffer();
    }

    private _nativeCanvas(width: number, height: number) {
        return NativeFactory.nativeCanvas(width, height);
    }
}