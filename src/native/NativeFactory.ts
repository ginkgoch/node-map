import { Middleware } from "./Middleware";
import { NativeImage } from "./NativeImage";

export class NativeFactory {
    private static _middleware?: Middleware;

    static register(middleware: Middleware) {
        NativeFactory._middleware = middleware;
    }

    static unregister() {
        NativeFactory._middleware = undefined;
    }

    static nativeImage(): NativeImage {
        return NativeFactory.__middleware.createNativeImage();
    }

    static nativeCanvas(width: number, height: number) {
        NativeFactory._checkHasRegistered();

        return NativeFactory.__middleware.createCanvasBySize(width, height);
    }

    private static _checkHasRegistered() {
        if (NativeFactory._middleware === undefined) {
            throw new Error('Native middleware is not registered.');
        }
    }

    private static get __middleware() {
        return NativeFactory._middleware as Middleware;
    }
}