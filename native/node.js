const { Canvas, Image } = require('canvas');

const defaultNodeCanvas = {
    createCanvas: (w, h) => new Canvas(w, h),
    createNativeImage: () => new Image()
};

const GK = require('ginkgoch-map').default.all;
module.exports = class NativeNode {
    static init() {
        GK.NativeFactory.register(defaultNodeCanvas);
    }
}