const defaultDomCanvas = {
    createCanvas: (w, h) => {
        const canvas = document.createElement('canvas');
        canvas.toBuffer = function () {
            return canvasBuffer(this, 'image/png');
        }.bind(canvas);
        canvas.width = w;
        canvas.height = h;
        return canvas;
    },
    createNativeImage: () => new Image()
};

let nativeImage = require('electron').nativeImage;
const types = ['image/png', 'image/jpg', 'image/jpeg'];
function canvasBuffer(canvas, type, quality) {
    type = type || 'image/png';
    quality = typeof quality === 'number' ? quality : 0.9;
    if (types.indexOf(type) === -1) {
        throw new Error('unsupported image type ' + type);
    }

    var data = canvas.toDataURL(type, quality);
    var img = typeof nativeImage.createFromDataURL === 'function'
        ? nativeImage.createFromDataURL(data) // electron v0.36+
        : nativeImage.createFromDataUrl(data); // electron v0.30
    if (/^image\/jpe?g$/.test(type)) {
        return img.toJpeg(Math.floor(quality * 100));
    } else {
        return img.toPng();
    }
}

const GK = require('ginkgoch-map').default.all;
module.exports = class NativeDOM {
    static init() {
        GK.NativeFactory.register(defaultDomCanvas);
    }
}