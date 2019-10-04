import { NativeAdaptor } from "./NativeAdaptor";
import { NativeImage } from "./NativeImage";

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