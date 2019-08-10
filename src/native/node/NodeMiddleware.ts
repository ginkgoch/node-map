import { Canvas, Image } from 'canvas';
import { Middleware, NativeImage, NativeCanvas } from '..';

export class NodeMiddleware extends Middleware {
    createNativeImage(): NativeImage {
        const image = new Image();
        return image;
    }

    createCanvasBySize(width: number, height: number): NativeCanvas {
        return new Canvas(width, height);
    }
}