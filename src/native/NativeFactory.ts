import { NativeAdaptor } from "./NativeAdaptor";
import { NativeImage } from "./NativeImage";

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

    static register(adaptor: NativeAdaptor) {
        NativeFactory._adaptor = adaptor;
    }

    static unregister() {
        NativeFactory._adaptor = undefined;
    }

    static nativeImage(): NativeImage {
        NativeFactory._checkHasRegistered();

        return NativeFactory._adaptor!.createNativeImage();
    }

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