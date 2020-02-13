import { Canvas, Image } from 'canvas';
import { NativeFactory } from "../src/native";
NativeFactory.register({
    createCanvas: (w: number, h: number) => new Canvas(w, h),
    createNativeImage: () => new Image()
});

export * from '../src/layers';
export * from '../src/render';
export * from '../src/shared';
export * from '../src/styles';
export * from '../src/map';
export * from 'ginkgoch-geom';