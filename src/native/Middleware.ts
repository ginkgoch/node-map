import { NativeImage } from "./NativeImage";
import { NativeCanvas } from "./NativeCanvas";

export abstract class Middleware {
    abstract createNativeImage(): NativeImage;

    abstract createCanvasBySize(width: number, height: number): NativeCanvas;
}