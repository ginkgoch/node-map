/**
 * This interface exports the necessary portable functions for canvas.
 */
export interface NativeCanvas {
    /**
     * Converts the reserving drawing caches into an image buffer that can be exportable to MD5 or stored on a physical disk.
     * @returns {Buffer} The image buffer.
     */
    toBuffer(): Buffer;

    /**
     * Gets a drawing context object that maintains the common drawing methods.
     * 
     * NOTE: the returning type is any, because it is enough so far to support all my use cases. 
     * But strictly, it should be another interface with common functions for drawing line, polygon, points etc.
     * I will improve this later when I collect enough scenarios.
     * 
     * @param {string} type The context type. e.g. `canvas.getContext("2d")`.
     */
    getContext(type: string): any;
}