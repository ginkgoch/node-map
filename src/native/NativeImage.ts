/**
 * This interface exports necessary properties to form an image.
 */
export interface NativeImage {
    /**
     * @property {number} width The image width in pixel.
     */
    width: number;
    /**
     * @property {number} height The image height in pixel.
     */
    height: number;
    /**
     * @property {string|Buffer} src The image file path or buffered data.
     */
    src?: string | Buffer
}