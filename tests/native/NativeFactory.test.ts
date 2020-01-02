import { NativeFactory } from "../../src";
import * as canvasImporter from 'canvas';

describe('NativeFactory', () => {
    it('registerFrom', () => {
        NativeFactory.registerFrom(canvasImporter);

        let canvas = NativeFactory.nativeCanvas(256, 256);
        expect(NativeFactory.isRegistered).toBeTruthy();
        expect(canvas).not.toBeNull();
        expect(canvas).not.toBeUndefined();
    });
})
