import { NativeImage } from "./NativeImage";
import { NativeCanvas } from "./NativeCanvas";

/**
 * This interface exports the necessary functions for adapting native drawing object to an unified API.
 * 
 * Ginkgoch map is designed to be a cross-platform mapping components. 
 * It is planning to support various OS (macOS, Win, Linux) as well as various platforms (Browser, Desktop, Mobile and Service).
 * So the native means the different graphic libraries on a specific platform.
 * When starting development on a new platform or OS, NativeAdaptor could be implemented to support to run or deploy on it.
 * 
 * import { Canvas, Image } from 'canvas';
 * 
 * class ServerNativeAdaptor implements NativeAdaptor {
 *      createNativeImage(): NativeImage {
 *          return new Image();
 *      }
 * 
 *      createCanvas(width: number, height: number): NativeCanvas {
 *          return new Canvas(width, height);
 *      }
 * }
 */
export interface NativeAdaptor {
    /**
     * Creates a native image object on a specific platform.
     * @returns {NativeImage} A native image object. A native image must implements `NativeImage` interface.
     */
    createNativeImage(): NativeImage;

    /**
     * Creates a native canvas on a specific platform. A canvas is a concrete rendering tool. e.g. Canvas is a native canvas in HTML5.
     * @param {number} width The width in pixel of the canvas.
     * @param {number} height The height in pixel of the canvas.
     * @returns {NativeCanvas} The native canvas with the specified canvas width and height.
     */
    createCanvas(width: number, height: number): NativeCanvas;
}