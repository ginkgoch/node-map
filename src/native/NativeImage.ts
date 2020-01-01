/**
 * This interface exports necessary properties to form an image.
 */
export interface NativeImage {
    /**
     * The image width in pixel.
     */
    width: number;
    /**
     * The image height in pixel.
     */
    height: number;
    /**
     * The image file path or buffered data.
     */
    src?: string | Buffer
}