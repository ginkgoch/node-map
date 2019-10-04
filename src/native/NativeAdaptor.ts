import { NativeImage } from "./NativeImage";
import { NativeCanvas } from "./NativeCanvas";

export interface NativeAdaptor {
    createNativeImage(): NativeImage;

    createCanvas(width: number, height: number): NativeCanvas;
}