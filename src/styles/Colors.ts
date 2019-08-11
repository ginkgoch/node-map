const colorDictionary = new Map<string, ColorInfo>();

interface ColorInfo {
    hueRange: number[] | null,
    lowerBounds: number[][],
    saturationRange: number[],
    brightnessRange: number[]
}

function defineColor(name: string, hueRange: number[] | null, lowerBounds: number[][]) {
    var sMin = lowerBounds[0][0],
        sMax = lowerBounds[lowerBounds.length - 1][0],

        bMin = lowerBounds[lowerBounds.length - 1][1],
        bMax = lowerBounds[0][1];

    colorDictionary.set(name, {
        hueRange: hueRange,
        lowerBounds: lowerBounds,
        saturationRange: [sMin, sMax],
        brightnessRange: [bMin, bMax]
    });
}

function loadColorBounds() {
    defineColor(
        'monochrome',
        null,
        [[0, 0], [100, 0]]
    );

    defineColor(
        'red',
        [-26, 18],
        [[20, 100], [30, 92], [40, 89], [50, 85], [60, 78], [70, 70], [80, 60], [90, 55], [100, 50]]
    );

    defineColor(
        'orange',
        [19, 46],
        [[20, 100], [30, 93], [40, 88], [50, 86], [60, 85], [70, 70], [100, 70]]
    );

    defineColor(
        'yellow',
        [47, 62],
        [[25, 100], [40, 94], [50, 89], [60, 86], [70, 84], [80, 82], [90, 80], [100, 75]]
    );

    defineColor(
        'green',
        [63, 178],
        [[30, 100], [40, 90], [50, 85], [60, 81], [70, 74], [80, 64], [90, 50], [100, 40]]
    );

    defineColor(
        'blue',
        [179, 257],
        [[20, 100], [30, 86], [40, 80], [50, 74], [60, 60], [70, 52], [80, 44], [90, 39], [100, 35]]
    );

    defineColor(
        'purple',
        [258, 282],
        [[20, 100], [30, 87], [40, 79], [50, 70], [60, 65], [70, 59], [80, 52], [90, 45], [100, 42]]
    );

    defineColor(
        'pink',
        [283, 334],
        [[20, 100], [30, 90], [40, 86], [60, 84], [80, 80], [90, 75], [100, 73]]
    );
}

function randomColor(options: any) {
    options = options || {};

    var H, S, B;
    H = pickHue(options);
    S = pickSaturation(H, options);
    B = pickBrightness(H, S, options);
    return setFormat([H, S, B], options);
}

function pickHue(options: any): number {
    let hueRange = getHueRange(options.hue)
    let hue = randomWithin(hueRange);
    if (hue < 0) {
        hue = 360 + hue;
    }

    return hue;
}

function getHueRange(colorInput: number | string) {
    if (typeof colorInput === 'number') {
        let number = colorInput;
        if (number < 360 && number > 0) {
            return [number, number];
        }
    }

    if (typeof colorInput === 'string') {
        if (colorDictionary.has(colorInput)) {
            let color = colorDictionary.get(colorInput) as ColorInfo;
            if (color.hueRange) { return color.hueRange; }
        } else if (colorInput.match(/^#?([0-9A-F]{3}|[0-9A-F]{6})$/i)) {
            var hue = HexToHSB(colorInput)[0];
            return [hue, hue];
        }
    }

    return [0, 360];
}

function HexToHSB(hex: string): number[] {
    hex = hex.replace(/^#/, '');
    hex = hex.length === 3 ? hex.replace(/(.)/g, '$1$1') : hex;

    var red = parseInt(hex.substr(0, 2), 16) / 255,
        green = parseInt(hex.substr(2, 2), 16) / 255,
        blue = parseInt(hex.substr(4, 2), 16) / 255;

    var cMax = Math.max(red, green, blue),
        delta = cMax - Math.min(red, green, blue),
        saturation = cMax ? (delta / cMax) : 0;

    switch (cMax) {
        case red: return [60 * (((green - blue) / delta) % 6) || 0, saturation, cMax];
        case green: return [60 * (((blue - red) / delta) + 2) || 0, saturation, cMax];
        case blue: return [60 * (((red - green) / delta) + 4) || 0, saturation, cMax];
        default: throw new Error(`Cannot convert hex color ${hex} to HSB color.`);
    }
}

function pickSaturation(hue: number, options: any): number {
    if (options.hue === 'monochrome') {
        return 0;
    }

    if (options.luminosity === 'random') {
        return randomWithin([0, 100]);
    }

    var saturationRange = getSaturationRange(hue);

    var sMin = saturationRange[0],
        sMax = saturationRange[1];

    switch (options.luminosity) {

        case 'bright':
            sMin = 55;
            break;

        case 'dark':
            sMin = sMax - 10;
            break;

        case 'light':
            sMax = 55;
            break;
    }

    return randomWithin([sMin, sMax]);
}

function getSaturationRange(hue: number) {
    return getColorInfo(hue).saturationRange;
}

function pickBrightness(H: number, S: number, options: any) {

    var bMin = getMinimumBrightness(H, S),
        bMax = 100;

    switch (options.luminosity) {

        case 'dark':
            bMax = bMin + 20;
            break;

        case 'light':
            bMin = (bMax + bMin) / 2;
            break;

        case 'random':
            bMin = 0;
            bMax = 100;
            break;
    }

    return randomWithin([bMin, bMax]);
}

function getMinimumBrightness(H: number, S: number): number {
    var lowerBounds = getColorInfo(H).lowerBounds;
    for (var i = 0; i < lowerBounds.length - 1; i++) {

        var s1 = lowerBounds[i][0],
            v1 = lowerBounds[i][1];

        var s2 = lowerBounds[i + 1][0],
            v2 = lowerBounds[i + 1][1];

        if (S >= s1 && S <= s2) {
            var m = (v2 - v1) / (s2 - s1),
                b = v1 - m * s1;

            return m * S + b;
        }
    }
    return 0;
}

function setFormat(hsv: number[], options: any) {
    switch (options.format) {
        case 'hsvArray':
            return hsv;

        case 'hslArray':
            return HSVtoHSL(hsv);

        case 'hsl':
            var hsl = HSVtoHSL(hsv);
            return 'hsl(' + hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%)';

        case 'hsla':
            var hslColor = HSVtoHSL(hsv);
            var alpha = options.alpha || Math.random();
            return 'hsla(' + hslColor[0] + ', ' + hslColor[1] + '%, ' + hslColor[2] + '%, ' + alpha + ')';

        case 'rgbArray':
            return HSVtoRGB(hsv);

        case 'rgb':
            var rgb = HSVtoRGB(hsv);
            return 'rgb(' + rgb.join(', ') + ')';

        case 'rgba':
            var rgbColor = HSVtoRGB(hsv);
            var alpha = options.alpha || Math.random();
            return 'rgba(' + rgbColor.join(', ') + ', ' + alpha + ')';

        default:
            return HSVtoHex(hsv);
    }
}

function HSVtoHSL(hsv: number[]) {
    var h = hsv[0],
        s = hsv[1] / 100,
        v = hsv[2] / 100,
        k = (2 - s) * v;

    return [
        h,
        Math.round(s * v / (k < 1 ? k : 2 - k) * 10000) / 100,
        k / 2 * 100
    ];
}

function HSVtoRGB(hsv: number[]) {
    var h = hsv[0];
    if (h === 0) { h = 1; }
    if (h === 360) { h = 359; }

    h = h / 360;
    var s = hsv[1] / 100,
        v = hsv[2] / 100;

    var h_i = Math.floor(h * 6),
        f = h * 6 - h_i,
        p = v * (1 - s),
        q = v * (1 - f * s),
        t = v * (1 - (1 - f) * s),
        r = 256,
        g = 256,
        b = 256;

    switch (h_i) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }

    var result = [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)];
    return result;
}

function HSVtoHex(hsv: number[]) {
    var rgb = HSVtoRGB(hsv);
    function componentToHex(c: number) {
        var hex = c.toString(16);
        return hex.length == 1 ? '0' + hex : hex;
    }

    var hex = '#' + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2]);
    return hex;
}

function getColorInfo(hue: number): ColorInfo {
    if (hue >= 334 && hue <= 360) {
        hue -= 360;
    }

    const keys = Array.from(colorDictionary.keys());
    for (var colorName of keys) {
        var color = colorDictionary.get(colorName) as ColorInfo;
        if (color.hueRange &&
            hue >= color.hueRange[0] &&
            hue <= color.hueRange[1]) {
            return color;
        }
    }

    throw new Error('Color not found.')
}

function randomWithin(range: number[]): number {
    var golden_ratio = 0.618033988749895
    var r = Math.random()
    r += golden_ratio
    r %= 1
    return Math.floor(range[0] + r * (range[1] + 1 - range[0]));
}

loadColorBounds();

export enum ColorFormat {
    hsvArray = 'hsvArray',
    hslArray = 'hslArray',
    hsl = 'hsl',
    hsla = 'hsla',
    rgbArray = 'rgbArray',
    rgb = 'rgb',
    rgba = 'rgba',
    hex = 'hex'
}

export enum RandomHue {
    random = 'random',
    red = 'red',
    orange = 'orange',
    yellow = 'yellow',
    green = 'green',
    blue = 'blue',
    purple = 'purple',
    pink = 'pink',
    monochrome = 'monochrome'
}

export enum RandomLuminosity {
    random = 'random',
    bright = 'bright',
    light = 'light',
    dark = 'dark'
}

export interface RandomColorOption {
    hue?: number | string | RandomHue,
    luminosity?: RandomLuminosity,
    /**
     * 0 - 1
     */
    alpha?: number,
    format?: ColorFormat
}

export class Colors {
    static random(options?: RandomColorOption): string | number[] {
        return randomColor(options);
    }

    static randomHex() {
        return <string>this.random();
    }

    static randomHexLight() {
        return <string>this.random({
            luminosity: RandomLuminosity.light
        });
    }

    static randomHexDark() {
        return <string>this.random({
            luminosity: RandomLuminosity.dark
        });
    }

    static randomHexBright() {
        return <string>this.random({
            luminosity: RandomLuminosity.bright
        });
    }
}