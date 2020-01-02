import { NativeAdaptor } from "./NativeAdaptor";
import { NativeImage } from "./NativeImage";
import _ from "lodash";

/**
 * This class represents a central factory for creating native adaptors with few callback registration. 
 * Once this is registered, it will be used everywhere during the concrete rendering.
 * 
 * Register a native adaptor on the fly.
 * 
 * ```typescript
 * import { Canvas, Image } from 'canvas';
 * import { NativeFactory } from 'ginkgoch-map';
 * 
 * NativeFactory.register({
 *      createCanvas: (w, h) => new Canvas(w, h),
 *      createNativeImage: () => new Image()
 * });
 * ```
 */
export class NativeFactory {
    private static _adaptor?: NativeAdaptor;

    /**
     * Registers a native adaptor.
     * @param {NativeAdaptor} adaptor The native adaptor. 
     */
    static register(adaptor: NativeAdaptor) {
        NativeFactory._adaptor = adaptor;
    }

    /**
     * Registers a native adaptor with node-canvas importer only.
     * @param {any} importer The node-canvas importer.
     * 
     * ```typescript
     * # requires canvas installed for this project or global first.
     * import * as canvasImporter from 'canvas';
     * NativeFactory.registerFrom(canvasImporter);
     * ```
     */
    static registerFrom(importer: any) {
        NativeFactory.register({
            createCanvas: (w: number, h: number) => new importer.Canvas(w, h),
            createNativeImage: () => new importer.Image()
        });
    }

    /**
     * Unregister current native adaptor.
     */
    static unregister() {
        NativeFactory._adaptor = undefined;
    }

    static isRegistered(): boolean {
        return !_.isEmpty(NativeFactory._adaptor);
    }

    /**
     * Creates native image by the registered adaptor. Throws exception if not registered.
     */
    static nativeImage(): NativeImage {
        NativeFactory._checkHasRegistered();

        return NativeFactory._adaptor!.createNativeImage();
    }

    /**
     * Creates native canvas by the registered adaptor. Throws exception if not registered.
     */
    static nativeCanvas(width: number, height: number) {
        NativeFactory._checkHasRegistered();

        return NativeFactory._adaptor!.createCanvas(width, height);
    }

    private static _checkHasRegistered() {
        if (NativeFactory._adaptor === undefined) {
            throw new Error('Native middleware is not registered.');
        }
    }
}