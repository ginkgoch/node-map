import { NativeImage } from "./NativeImage";
import { NativeCanvas } from "./NativeCanvas";

export interface Middleware {
    createNativeImage(): NativeImage;

    createCanvas(width: number, height: number): NativeCanvas;
}