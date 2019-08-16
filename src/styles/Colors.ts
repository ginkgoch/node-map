import assert from 'assert';

//#region color resource
class ColorResource {
    colorDictionary = new Map<string, ColorInfo>();

    constructor() {
        this.loadColorBounds();
    }

    defineColor(name: string, hueRange: number[] | null, lowerBounds: number[][]) {
        var sMin = lowerBounds[0][0],
            sMax = lowerBounds[lowerBounds.length - 1][0],
            bMin = lowerBounds[lowerBounds.length - 1][1],
            bMax = lowerBounds[0][1];

        this.colorDictionary.set(name, {
            hueRange: hueRange,
            lowerBounds: lowerBounds,
            saturationRange: [sMin, sMax],
            brightnessRange: [bMin, bMax]
        });
    }

    loadColorBounds() {
        this.defineColor(
            'monochrome',
            null,
            [[0, 0], [100, 0]]
        );

        this.defineColor(
            'red',
            [-26, 18],
            [[20, 100], [30, 92], [40, 89], [50, 85], [60, 78], [70, 70], [80, 60], [90, 55], [100, 50]]
        );

        this.defineColor(
            'orange',
            [19, 46],
            [[20, 100], [30, 93], [40, 88], [50, 86], [60, 85], [70, 70], [100, 70]]
        );

        this.defineColor(
            'yellow',
            [47, 62],
            [[25, 100], [40, 94], [50, 89], [60, 86], [70, 84], [80, 82], [90, 80], [100, 75]]
        );

        this.defineColor(
            'green',
            [63, 178],
            [[30, 100], [40, 90], [50, 85], [60, 81], [70, 74], [80, 64], [90, 50], [100, 40]]
        );

        this.defineColor(
            'blue',
            [179, 257],
            [[20, 100], [30, 86], [40, 80], [50, 74], [60, 60], [70, 52], [80, 44], [90, 39], [100, 35]]
        );

        this.defineColor(
            'purple',
            [258, 282],
            [[20, 100], [30, 87], [40, 79], [50, 70], [60, 65], [70, 59], [80, 52], [90, 45], [100, 42]]
        );

        this.defineColor(
            'pink',
            [283, 334],
            [[20, 100], [30, 90], [40, 86], [60, 84], [80, 80], [90, 75], [100, 73]]
        );
    }

    randomColor(options: any) {
        options = options || {};

        var H, S, B;
        H = this.pickHue(options);
        S = this.pickSaturation(H, options);
        B = this.pickBrightness(H, S, options);
        return this.setFormat([H, S, B], options);
    }

    pickHue(options: any): number {
        let hueRange = this.getHueRange(options.hue)
        let hue = this.randomWithin(hueRange);
        if (hue < 0) {
            hue = 360 + hue;
        }

        return hue;
    }

    getHueRange(colorInput: number | string) {
        if (typeof colorInput === 'number') {
            let number = colorInput;
            if (number < 360 && number > 0) {
                return [number, number];
            }
        }

        if (typeof colorInput === 'string') {
            if (this.colorDictionary.has(colorInput)) {
                let color = this.colorDictionary.get(colorInput) as ColorInfo;
                if (color.hueRange) { return color.hueRange; }
            } else if (colorInput.match(/^#?([0-9A-F]{3}|[0-9A-F]{6})$/i)) {
                var hue = this.HexToHSB(colorInput)[0];
                return [hue, hue];
            }
        }

        return [0, 360];
    }

    HexToHSB(hex: string): number[] {
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

    HueToRgb(p: number, q: number, t: number) {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
        if (t < 1.0 / 2.0) return q;
        if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6;
        return p;
    }

    HexToHSL(hex: string) {
        hex = hex.replace(/^#/, '');
        hex = hex.length === 3 ? hex.replace(/(.)/g, '$1$1') : hex;

        var red = parseInt(hex.substr(0, 2), 16) / 255,
            green = parseInt(hex.substr(2, 2), 16) / 255,
            blue = parseInt(hex.substr(4, 2), 16) / 255;

        let max = Math.max(red, green, blue);
        let min = Math.min(red, green, blue);
        let h, s, l = (max + min) / 2;
        if (max === min) {
            h = s = 0;
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max == red) {
                h = (green - blue) / d + (green < blue ? 6 : 0);
            }
            else if (max == green) {
                h = (blue - red) / d + 2;
            }
            else if (max == blue) {
                h = (red - green) / d + 4;
            }
            else {
                throw new Error(`${hex} is not in range.`);
            }

            h /= 6;
        }

        return [h, s, l];
    }

    HSLToHex(hsl: number[]) {
        let [hue, saturation, luminosity] = hsl;
        let r, g, b;

        if (saturation == 0) {
            r = g = b = luminosity; // achromatic
        }
        else {
            var q = luminosity < 0.5 ? luminosity * (1 + saturation) : luminosity + saturation - luminosity * saturation;
            var p = 2 * luminosity - q;
            r = this.HueToRgb(p, q, hue + 1.0 / 3.0);
            g = this.HueToRgb(p, q, hue);
            b = this.HueToRgb(p, q, hue - 1.0 / 3.0);
        }

        [r, g, b] = [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
        return hex;
    }

    pickSaturation(hue: number, options: any): number {
        if (options.hue === 'monochrome') {
            return 0;
        }

        if (options.luminosity === 'random') {
            return this.randomWithin([0, 100]);
        }

        var saturationRange = this.getSaturationRange(hue);

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

        return this.randomWithin([sMin, sMax]);
    }

    getSaturationRange(hue: number) {
        return this.getColorInfo(hue).saturationRange;
    }

    pickBrightness(H: number, S: number, options: any) {
        var bMin = this.getMinimumBrightness(H, S),
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

        return this.randomWithin([bMin, bMax]);
    }

    getMinimumBrightness(H: number, S: number): number {
        var lowerBounds = this.getColorInfo(H).lowerBounds;
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

    setFormat(hsv: number[], options: any) {
        switch (options.format) {
            case 'hsvArray':
                return hsv;

            case 'hslArray':
                return this.HSVtoHSL(hsv);

            case 'hsl':
                var hsl = this.HSVtoHSL(hsv);
                return 'hsl(' + hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%)';

            case 'hsla':
                var hslColor = this.HSVtoHSL(hsv);
                var alpha = options.alpha || Math.random();
                return 'hsla(' + hslColor[0] + ', ' + hslColor[1] + '%, ' + hslColor[2] + '%, ' + alpha + ')';

            case 'rgbArray':
                return this.HSVtoRGB(hsv);

            case 'rgb':
                var rgb = this.HSVtoRGB(hsv);
                return 'rgb(' + rgb.join(', ') + ')';

            case 'rgba':
                var rgbColor = this.HSVtoRGB(hsv);
                var alpha = options.alpha || Math.random();
                return 'rgba(' + rgbColor.join(', ') + ', ' + alpha + ')';

            default:
                return this.HSVtoHex(hsv);
        }
    }

    HSVtoHSL(hsv: number[]) {
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

    HSVtoRGB(hsv: number[]) {
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

    HSVtoHex(hsv: number[]) {
        var rgb = this.HSVtoRGB(hsv);
        function componentToHex(c: number) {
            var hex = c.toString(16);
            return hex.length == 1 ? '0' + hex : hex;
        }

        var hex = '#' + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2]);
        return hex;
    }

    getColorInfo(hue: number): ColorInfo {
        if (hue >= 334 && hue <= 360) {
            hue -= 360;
        }

        const keys = Array.from(this.colorDictionary.keys());
        for (var colorName of keys) {
            var color = this.colorDictionary.get(colorName) as ColorInfo;
            if (color.hueRange &&
                hue >= color.hueRange[0] &&
                hue <= color.hueRange[1]) {
                return color;
            }
        }

        throw new Error('Color not found.')
    }

    randomWithin(range: number[]): number {
        var golden_ratio = 0.618033988749895
        var r = Math.random()
        r += golden_ratio
        r %= 1
        return Math.floor(range[0] + r * (range[1] + 1 - range[0]));
    }
}
//#endregion

interface ColorInfo {
    hueRange: number[] | null,
    lowerBounds: number[][],
    saturationRange: number[],
    brightnessRange: number[]
}

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
    static all = new Map<string, string[]>([["INDIANRED", ["#CD5C5C", "RGB(205, 92, 92)"]], ["LIGHTCORAL", ["#F08080", "RGB(240, 128, 128)"]], ["SALMON", ["#FA8072", "RGB(250, 128, 114)"]], ["DARKSALMON", ["#E9967A", "RGB(233, 150, 122)"]], ["LIGHTSALMON", ["#FFA07A", "RGB(255, 160, 122)"]], ["CRIMSON", ["#DC143C", "RGB(220, 20, 60)"]], ["RED", ["#FF0000", "RGB(255, 0, 0)"]], ["FIREBRICK", ["#B22222", "RGB(178, 34, 34)"]], ["DARKRED", ["#8B0000", "RGB(139, 0, 0)"]], ["PINK", ["#FFC0CB", "RGB(255, 192, 203)"]], ["LIGHTPINK", ["#FFB6C1", "RGB(255, 182, 193)"]], ["HOTPINK", ["#FF69B4", "RGB(255, 105, 180)"]], ["DEEPPINK", ["#FF1493", "RGB(255, 20, 147)"]], ["MEDIUMVIOLETRED", ["#C71585", "RGB(199, 21, 133)"]], ["PALEVIOLETRED", ["#DB7093", "RGB(219, 112, 147)"]], ["LIGHTSALMON", ["#FFA07A", "RGB(255, 160, 122)"]], ["CORAL", ["#FF7F50", "RGB(255, 127, 80)"]], ["TOMATO", ["#FF6347", "RGB(255, 99, 71)"]], ["ORANGERED", ["#FF4500", "RGB(255, 69, 0)"]], ["DARKORANGE", ["#FF8C00", "RGB(255, 140, 0)"]], ["ORANGE", ["#FFA500", "RGB(255, 165, 0)"]], ["GOLD", ["#FFD700", "RGB(255, 215, 0)"]], ["YELLOW", ["#FFFF00", "RGB(255, 255, 0)"]], ["LIGHTYELLOW", ["#FFFFE0", "RGB(255, 255, 224)"]], ["LEMONCHIFFON", ["#FFFACD", "RGB(255, 250, 205)"]], ["LIGHTGOLDENRODYELLOW", ["#FAFAD2", "RGB(250, 250, 210)"]], ["PAPAYAWHIP", ["#FFEFD5", "RGB(255, 239, 213)"]], ["MOCCASIN", ["#FFE4B5", "RGB(255, 228, 181)"]], ["PEACHPUFF", ["#FFDAB9", "RGB(255, 218, 185)"]], ["PALEGOLDENROD", ["#EEE8AA", "RGB(238, 232, 170)"]], ["KHAKI", ["#F0E68C", "RGB(240, 230, 140)"]], ["DARKKHAKI", ["#BDB76B", "RGB(189, 183, 107)"]], ["LAVENDER", ["#E6E6FA", "RGB(230, 230, 250)"]], ["THISTLE", ["#D8BFD8", "RGB(216, 191, 216)"]], ["PLUM", ["#DDA0DD", "RGB(221, 160, 221)"]], ["VIOLET", ["#EE82EE", "RGB(238, 130, 238)"]], ["ORCHID", ["#DA70D6", "RGB(218, 112, 214)"]], ["FUCHSIA", ["#FF00FF", "RGB(255, 0, 255)"]], ["MAGENTA", ["#FF00FF", "RGB(255, 0, 255)"]], ["MEDIUMORCHID", ["#BA55D3", "RGB(186, 85, 211)"]], ["MEDIUMPURPLE", ["#9370DB", "RGB(147, 112, 219)"]], ["REBECCAPURPLE", ["#663399", "RGB(102, 51, 153)"]], ["BLUEVIOLET", ["#8A2BE2", "RGB(138, 43, 226)"]], ["DARKVIOLET", ["#9400D3", "RGB(148, 0, 211)"]], ["DARKORCHID", ["#9932CC", "RGB(153, 50, 204)"]], ["DARKMAGENTA", ["#8B008B", "RGB(139, 0, 139)"]], ["PURPLE", ["#800080", "RGB(128, 0, 128)"]], ["INDIGO", ["#4B0082", "RGB(75, 0, 130)"]], ["SLATEBLUE", ["#6A5ACD", "RGB(106, 90, 205)"]], ["DARKSLATEBLUE", ["#483D8B", "RGB(72, 61, 139)"]], ["MEDIUMSLATEBLUE", ["#7B68EE", "RGB(123, 104, 238)"]], ["GREENYELLOW", ["#ADFF2F", "RGB(173, 255, 47)"]], ["CHARTREUSE", ["#7FFF00", "RGB(127, 255, 0)"]], ["LAWNGREEN", ["#7CFC00", "RGB(124, 252, 0)"]], ["LIME", ["#00FF00", "RGB(0, 255, 0)"]], ["LIMEGREEN", ["#32CD32", "RGB(50, 205, 50)"]], ["PALEGREEN", ["#98FB98", "RGB(152, 251, 152)"]], ["LIGHTGREEN", ["#90EE90", "RGB(144, 238, 144)"]], ["MEDIUMSPRINGGREEN", ["#00FA9A", "RGB(0, 250, 154)"]], ["SPRINGGREEN", ["#00FF7F", "RGB(0, 255, 127)"]], ["MEDIUMSEAGREEN", ["#3CB371", "RGB(60, 179, 113)"]], ["SEAGREEN", ["#2E8B57", "RGB(46, 139, 87)"]], ["FORESTGREEN", ["#228B22", "RGB(34, 139, 34)"]], ["GREEN", ["#008000", "RGB(0, 128, 0)"]], ["DARKGREEN", ["#006400", "RGB(0, 100, 0)"]], ["YELLOWGREEN", ["#9ACD32", "RGB(154, 205, 50)"]], ["OLIVEDRAB", ["#6B8E23", "RGB(107, 142, 35)"]], ["OLIVE", ["#808000", "RGB(128, 128, 0)"]], ["DARKOLIVEGREEN", ["#556B2F", "RGB(85, 107, 47)"]], ["MEDIUMAQUAMARINE", ["#66CDAA", "RGB(102, 205, 170)"]], ["DARKSEAGREEN", ["#8FBC8B", "RGB(143, 188, 139)"]], ["LIGHTSEAGREEN", ["#20B2AA", "RGB(32, 178, 170)"]], ["DARKCYAN", ["#008B8B", "RGB(0, 139, 139)"]], ["TEAL", ["#008080", "RGB(0, 128, 128)"]], ["AQUA", ["#00FFFF", "RGB(0, 255, 255)"]], ["CYAN", ["#00FFFF", "RGB(0, 255, 255)"]], ["LIGHTCYAN", ["#E0FFFF", "RGB(224, 255, 255)"]], ["PALETURQUOISE", ["#AFEEEE", "RGB(175, 238, 238)"]], ["AQUAMARINE", ["#7FFFD4", "RGB(127, 255, 212)"]], ["TURQUOISE", ["#40E0D0", "RGB(64, 224, 208)"]], ["MEDIUMTURQUOISE", ["#48D1CC", "RGB(72, 209, 204)"]], ["DARKTURQUOISE", ["#00CED1", "RGB(0, 206, 209)"]], ["CADETBLUE", ["#5F9EA0", "RGB(95, 158, 160)"]], ["STEELBLUE", ["#4682B4", "RGB(70, 130, 180)"]], ["LIGHTSTEELBLUE", ["#B0C4DE", "RGB(176, 196, 222)"]], ["POWDERBLUE", ["#B0E0E6", "RGB(176, 224, 230)"]], ["LIGHTBLUE", ["#ADD8E6", "RGB(173, 216, 230)"]], ["SKYBLUE", ["#87CEEB", "RGB(135, 206, 235)"]], ["LIGHTSKYBLUE", ["#87CEFA", "RGB(135, 206, 250)"]], ["DEEPSKYBLUE", ["#00BFFF", "RGB(0, 191, 255)"]], ["DODGERBLUE", ["#1E90FF", "RGB(30, 144, 255)"]], ["CORNFLOWERBLUE", ["#6495ED", "RGB(100, 149, 237)"]], ["MEDIUMSLATEBLUE", ["#7B68EE", "RGB(123, 104, 238)"]], ["ROYALBLUE", ["#4169E1", "RGB(65, 105, 225)"]], ["BLUE", ["#0000FF", "RGB(0, 0, 255)"]], ["MEDIUMBLUE", ["#0000CD", "RGB(0, 0, 205)"]], ["DARKBLUE", ["#00008B", "RGB(0, 0, 139)"]], ["NAVY", ["#000080", "RGB(0, 0, 128)"]], ["MIDNIGHTBLUE", ["#191970", "RGB(25, 25, 112)"]], ["CORNSILK", ["#FFF8DC", "RGB(255, 248, 220)"]], ["BLANCHEDALMOND", ["#FFEBCD", "RGB(255, 235, 205)"]], ["BISQUE", ["#FFE4C4", "RGB(255, 228, 196)"]], ["NAVAJOWHITE", ["#FFDEAD", "RGB(255, 222, 173)"]], ["WHEAT", ["#F5DEB3", "RGB(245, 222, 179)"]], ["BURLYWOOD", ["#DEB887", "RGB(222, 184, 135)"]], ["TAN", ["#D2B48C", "RGB(210, 180, 140)"]], ["ROSYBROWN", ["#BC8F8F", "RGB(188, 143, 143)"]], ["SANDYBROWN", ["#F4A460", "RGB(244, 164, 96)"]], ["GOLDENROD", ["#DAA520", "RGB(218, 165, 32)"]], ["DARKGOLDENROD", ["#B8860B", "RGB(184, 134, 11)"]], ["PERU", ["#CD853F", "RGB(205, 133, 63)"]], ["CHOCOLATE", ["#D2691E", "RGB(210, 105, 30)"]], ["SADDLEBROWN", ["#8B4513", "RGB(139, 69, 19)"]], ["SIENNA", ["#A0522D", "RGB(160, 82, 45)"]], ["BROWN", ["#A52A2A", "RGB(165, 42, 42)"]], ["MAROON", ["#800000", "RGB(128, 0, 0)"]], ["WHITE", ["#FFFFFF", "RGB(255, 255, 255)"]], ["SNOW", ["#FFFAFA", "RGB(255, 250, 250)"]], ["HONEYDEW", ["#F0FFF0", "RGB(240, 255, 240)"]], ["MINTCREAM", ["#F5FFFA", "RGB(245, 255, 250)"]], ["AZURE", ["#F0FFFF", "RGB(240, 255, 255)"]], ["ALICEBLUE", ["#F0F8FF", "RGB(240, 248, 255)"]], ["GHOSTWHITE", ["#F8F8FF", "RGB(248, 248, 255)"]], ["WHITESMOKE", ["#F5F5F5", "RGB(245, 245, 245)"]], ["SEASHELL", ["#FFF5EE", "RGB(255, 245, 238)"]], ["BEIGE", ["#F5F5DC", "RGB(245, 245, 220)"]], ["OLDLACE", ["#FDF5E6", "RGB(253, 245, 230)"]], ["FLORALWHITE", ["#FFFAF0", "RGB(255, 250, 240)"]], ["IVORY", ["#FFFFF0", "RGB(255, 255, 240)"]], ["ANTIQUEWHITE", ["#FAEBD7", "RGB(250, 235, 215)"]], ["LINEN", ["#FAF0E6", "RGB(250, 240, 230)"]], ["LAVENDERBLUSH", ["#FFF0F5", "RGB(255, 240, 245)"]], ["MISTYROSE", ["#FFE4E1", "RGB(255, 228, 225)"]], ["GAINSBORO", ["#DCDCDC", "RGB(220, 220, 220)"]], ["LIGHTGRAY", ["#D3D3D3", "RGB(211, 211, 211)"]], ["SILVER", ["#C0C0C0", "RGB(192, 192, 192)"]], ["DARKGRAY", ["#A9A9A9", "RGB(169, 169, 169)"]], ["GRAY", ["#808080", "RGB(128, 128, 128)"]], ["DIMGRAY", ["#696969", "RGB(105, 105, 105)"]], ["LIGHTSLATEGRAY", ["#778899", "RGB(119, 136, 153)"]], ["SLATEGRAY", ["#708090", "RGB(112, 128, 144)"]], ["DARKSLATEGRAY", ["#2F4F4F", "RGB(47, 79, 79)"]], ["BLACK", ["#000000", "RGB(0, 0, 0)"]]]);

    static color(name: string, type: 'html' | 'rgb' = 'html'): string | undefined {
        const colorItem = this.all.get(name.toUpperCase());
        if (colorItem === undefined) {
            return undefined;
        } else {
            return type === 'rgb' ? colorItem[1] : colorItem[0];
        }
    }

    static random(options?: RandomColorOption): string | number[] {
        return this._resource.randomColor(options);
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

    /**
     * Gets a html color list between the specific from and end color.
     * @param fromColor The from html color or name.
     * @param toColor The to html color or name.
     * @param count 
     */
    static between(fromColor: string, toColor: string, count: number): string[] {
        assert(count > 1, 'Count must be greater than 1 colors.');

        const fromHSL = this._colorToHSL(fromColor);
        const toHSL = this._colorToHSL(toColor);
        const segCount = count - 1;

        const incrementH = (toHSL[0] - fromHSL[0]) / segCount;
        const incrementS = (toHSL[1] - fromHSL[1]) / segCount;
        const incrementL = (toHSL[2] - fromHSL[2]) / segCount;

        const hslColors = new Array<number[]>();
        hslColors.push(fromHSL);
        for (let i = 0; i < segCount - 1; i++) {
            hslColors.push([
                this._round(fromHSL[0] + incrementH * i),
                this._round(fromHSL[1] + incrementS * i),
                this._round(fromHSL[2] + incrementL * i)]);
        }
        hslColors.push(toHSL);

        const hexColors = hslColors.map(hsl => this._resource.HSLToHex(hsl));
        return hexColors;
    }

    static forward(color: string, count: number,
        forwardPercentage: number = 100,
        colorFamily: 'hue' | 'saturation' | 'luminosity' | 'all' = 'hue') {

        return this._forwardOrBackward(color, count, forwardPercentage, colorFamily, true);
    }

    static backward(color: string, count: number,
        forwardPercentage: number = 100,
        colorFamily: 'hue' | 'saturation' | 'luminosity' | 'all' = 'hue') {

        return this._forwardOrBackward(color, count, forwardPercentage, colorFamily, false);
    }

    private static _forwardOrBackward(color: string, count: number,
        forwardPercentage: number = 100,
        colorFamily: 'hue' | 'saturation' | 'luminosity' | 'all' = 'hue', forward = true) {
        let result = new Array<string>();
        if (count <= 0) return result;

        result.push(color);
        if (count === 1) {
            return result;
        }

        const increment = forwardPercentage * .01 / (count - 1);
        const fromHSL = this._colorToHSL(color);
        const segCount = count - 1;

        const hslColors = new Array<number[]>();
        hslColors.push(fromHSL);
        for (let i = 0; i < segCount; i++) {
            hslColors.push([
                this._round(fromHSL[0] + i * this._increment(increment, colorFamily, 'hue', forward)),
                this._round(fromHSL[1] + i * this._increment(increment, colorFamily, 'saturation', forward)),
                this._round(fromHSL[2] + i * this._increment(increment, colorFamily, 'luminosity', forward))]);
        }

        const hexColors = hslColors.map(hsl => this._resource.HSLToHex(hsl));
        return hexColors;
    }

    private static _round(v: number, min: number = 0, max: number = 1) {
        while (v > max) {
            v -= max;
        }

        while (v < min) {
            v += max;
        }

        return v;
    }

    private static _increment(increment: number, colorFamily: 'hue' | 'saturation' | 'luminosity' | 'all', expect: string, forward = true) {
        if (expect === colorFamily || colorFamily === 'all') {
            return increment * (forward ? 1 : -1);
        } else {
            return 0;
        }
    }

    private static get _resource() {
        const colorResourceDesc = 'GK_COLOR_RESOURCE';
        let colorResourceKey = Symbol.for(colorResourceDesc);
        let colorResource: ColorResource = (<any>global)[colorResourceKey];
        if (colorResource === undefined) {
            (<any>global)[colorResourceKey] = colorResource = new ColorResource();
        }

        return colorResource;
    }

    private static _colorToHSL(color: string) {
        if (!color.startsWith('#')) {
            if (Colors.all.has(color.toUpperCase())) {
                color = Colors.color(color.toUpperCase())!;
            }
        }

        return this._resource.HexToHSL(color);
    }

    //#region well known colors

    static get INDIANRED() {
        return this.all.get('INDIANRED')![0];
    }

    static get LIGHTCORAL() {
        return this.all.get('LIGHTCORAL')![0];
    }

    static get SALMON() {
        return this.all.get('SALMON')![0];
    }

    static get DARKSALMON() {
        return this.all.get('DARKSALMON')![0];
    }

    static get LIGHTSALMON() {
        return this.all.get('LIGHTSALMON')![0];
    }

    static get CRIMSON() {
        return this.all.get('CRIMSON')![0];
    }

    static get RED() {
        return this.all.get('RED')![0];
    }

    static get FIREBRICK() {
        return this.all.get('FIREBRICK')![0];
    }

    static get DARKRED() {
        return this.all.get('DARKRED')![0];
    }

    static get PINK() {
        return this.all.get('PINK')![0];
    }

    static get LIGHTPINK() {
        return this.all.get('LIGHTPINK')![0];
    }

    static get HOTPINK() {
        return this.all.get('HOTPINK')![0];
    }

    static get DEEPPINK() {
        return this.all.get('DEEPPINK')![0];
    }

    static get MEDIUMVIOLETRED() {
        return this.all.get('MEDIUMVIOLETRED')![0];
    }

    static get PALEVIOLETRED() {
        return this.all.get('PALEVIOLETRED')![0];
    }

    static get CORAL() {
        return this.all.get('CORAL')![0];
    }

    static get TOMATO() {
        return this.all.get('TOMATO')![0];
    }

    static get ORANGERED() {
        return this.all.get('ORANGERED')![0];
    }

    static get DARKORANGE() {
        return this.all.get('DARKORANGE')![0];
    }

    static get ORANGE() {
        return this.all.get('ORANGE')![0];
    }

    static get GOLD() {
        return this.all.get('GOLD')![0];
    }

    static get YELLOW() {
        return this.all.get('YELLOW')![0];
    }

    static get LIGHTYELLOW() {
        return this.all.get('LIGHTYELLOW')![0];
    }

    static get LEMONCHIFFON() {
        return this.all.get('LEMONCHIFFON')![0];
    }

    static get LIGHTGOLDENRODYELLOW() {
        return this.all.get('LIGHTGOLDENRODYELLOW')![0];
    }

    static get PAPAYAWHIP() {
        return this.all.get('PAPAYAWHIP')![0];
    }

    static get MOCCASIN() {
        return this.all.get('MOCCASIN')![0];
    }

    static get PEACHPUFF() {
        return this.all.get('PEACHPUFF')![0];
    }

    static get PALEGOLDENROD() {
        return this.all.get('PALEGOLDENROD')![0];
    }

    static get KHAKI() {
        return this.all.get('KHAKI')![0];
    }

    static get DARKKHAKI() {
        return this.all.get('DARKKHAKI')![0];
    }

    static get LAVENDER() {
        return this.all.get('LAVENDER')![0];
    }

    static get THISTLE() {
        return this.all.get('THISTLE')![0];
    }

    static get PLUM() {
        return this.all.get('PLUM')![0];
    }

    static get VIOLET() {
        return this.all.get('VIOLET')![0];
    }

    static get ORCHID() {
        return this.all.get('ORCHID')![0];
    }

    static get FUCHSIA() {
        return this.all.get('FUCHSIA')![0];
    }

    static get MAGENTA() {
        return this.all.get('MAGENTA')![0];
    }

    static get MEDIUMORCHID() {
        return this.all.get('MEDIUMORCHID')![0];
    }

    static get MEDIUMPURPLE() {
        return this.all.get('MEDIUMPURPLE')![0];
    }

    static get REBECCAPURPLE() {
        return this.all.get('REBECCAPURPLE')![0];
    }

    static get BLUEVIOLET() {
        return this.all.get('BLUEVIOLET')![0];
    }

    static get DARKVIOLET() {
        return this.all.get('DARKVIOLET')![0];
    }

    static get DARKORCHID() {
        return this.all.get('DARKORCHID')![0];
    }

    static get DARKMAGENTA() {
        return this.all.get('DARKMAGENTA')![0];
    }

    static get PURPLE() {
        return this.all.get('PURPLE')![0];
    }

    static get INDIGO() {
        return this.all.get('INDIGO')![0];
    }

    static get SLATEBLUE() {
        return this.all.get('SLATEBLUE')![0];
    }

    static get DARKSLATEBLUE() {
        return this.all.get('DARKSLATEBLUE')![0];
    }

    static get MEDIUMSLATEBLUE() {
        return this.all.get('MEDIUMSLATEBLUE')![0];
    }

    static get GREENYELLOW() {
        return this.all.get('GREENYELLOW')![0];
    }

    static get CHARTREUSE() {
        return this.all.get('CHARTREUSE')![0];
    }

    static get LAWNGREEN() {
        return this.all.get('LAWNGREEN')![0];
    }

    static get LIME() {
        return this.all.get('LIME')![0];
    }

    static get LIMEGREEN() {
        return this.all.get('LIMEGREEN')![0];
    }

    static get PALEGREEN() {
        return this.all.get('PALEGREEN')![0];
    }

    static get LIGHTGREEN() {
        return this.all.get('LIGHTGREEN')![0];
    }

    static get MEDIUMSPRINGGREEN() {
        return this.all.get('MEDIUMSPRINGGREEN')![0];
    }

    static get SPRINGGREEN() {
        return this.all.get('SPRINGGREEN')![0];
    }

    static get MEDIUMSEAGREEN() {
        return this.all.get('MEDIUMSEAGREEN')![0];
    }

    static get SEAGREEN() {
        return this.all.get('SEAGREEN')![0];
    }

    static get FORESTGREEN() {
        return this.all.get('FORESTGREEN')![0];
    }

    static get GREEN() {
        return this.all.get('GREEN')![0];
    }

    static get DARKGREEN() {
        return this.all.get('DARKGREEN')![0];
    }

    static get YELLOWGREEN() {
        return this.all.get('YELLOWGREEN')![0];
    }

    static get OLIVEDRAB() {
        return this.all.get('OLIVEDRAB')![0];
    }

    static get OLIVE() {
        return this.all.get('OLIVE')![0];
    }

    static get DARKOLIVEGREEN() {
        return this.all.get('DARKOLIVEGREEN')![0];
    }

    static get MEDIUMAQUAMARINE() {
        return this.all.get('MEDIUMAQUAMARINE')![0];
    }

    static get DARKSEAGREEN() {
        return this.all.get('DARKSEAGREEN')![0];
    }

    static get LIGHTSEAGREEN() {
        return this.all.get('LIGHTSEAGREEN')![0];
    }

    static get DARKCYAN() {
        return this.all.get('DARKCYAN')![0];
    }

    static get TEAL() {
        return this.all.get('TEAL')![0];
    }

    static get AQUA() {
        return this.all.get('AQUA')![0];
    }

    static get CYAN() {
        return this.all.get('CYAN')![0];
    }

    static get LIGHTCYAN() {
        return this.all.get('LIGHTCYAN')![0];
    }

    static get PALETURQUOISE() {
        return this.all.get('PALETURQUOISE')![0];
    }

    static get AQUAMARINE() {
        return this.all.get('AQUAMARINE')![0];
    }

    static get TURQUOISE() {
        return this.all.get('TURQUOISE')![0];
    }

    static get MEDIUMTURQUOISE() {
        return this.all.get('MEDIUMTURQUOISE')![0];
    }

    static get DARKTURQUOISE() {
        return this.all.get('DARKTURQUOISE')![0];
    }

    static get CADETBLUE() {
        return this.all.get('CADETBLUE')![0];
    }

    static get STEELBLUE() {
        return this.all.get('STEELBLUE')![0];
    }

    static get LIGHTSTEELBLUE() {
        return this.all.get('LIGHTSTEELBLUE')![0];
    }

    static get POWDERBLUE() {
        return this.all.get('POWDERBLUE')![0];
    }

    static get LIGHTBLUE() {
        return this.all.get('LIGHTBLUE')![0];
    }

    static get SKYBLUE() {
        return this.all.get('SKYBLUE')![0];
    }

    static get LIGHTSKYBLUE() {
        return this.all.get('LIGHTSKYBLUE')![0];
    }

    static get DEEPSKYBLUE() {
        return this.all.get('DEEPSKYBLUE')![0];
    }

    static get DODGERBLUE() {
        return this.all.get('DODGERBLUE')![0];
    }

    static get CORNFLOWERBLUE() {
        return this.all.get('CORNFLOWERBLUE')![0];
    }

    static get ROYALBLUE() {
        return this.all.get('ROYALBLUE')![0];
    }

    static get BLUE() {
        return this.all.get('BLUE')![0];
    }

    static get MEDIUMBLUE() {
        return this.all.get('MEDIUMBLUE')![0];
    }

    static get DARKBLUE() {
        return this.all.get('DARKBLUE')![0];
    }

    static get NAVY() {
        return this.all.get('NAVY')![0];
    }

    static get MIDNIGHTBLUE() {
        return this.all.get('MIDNIGHTBLUE')![0];
    }

    static get CORNSILK() {
        return this.all.get('CORNSILK')![0];
    }

    static get BLANCHEDALMOND() {
        return this.all.get('BLANCHEDALMOND')![0];
    }

    static get BISQUE() {
        return this.all.get('BISQUE')![0];
    }

    static get NAVAJOWHITE() {
        return this.all.get('NAVAJOWHITE')![0];
    }

    static get WHEAT() {
        return this.all.get('WHEAT')![0];
    }

    static get BURLYWOOD() {
        return this.all.get('BURLYWOOD')![0];
    }

    static get TAN() {
        return this.all.get('TAN')![0];
    }

    static get ROSYBROWN() {
        return this.all.get('ROSYBROWN')![0];
    }

    static get SANDYBROWN() {
        return this.all.get('SANDYBROWN')![0];
    }

    static get GOLDENROD() {
        return this.all.get('GOLDENROD')![0];
    }

    static get DARKGOLDENROD() {
        return this.all.get('DARKGOLDENROD')![0];
    }

    static get PERU() {
        return this.all.get('PERU')![0];
    }

    static get CHOCOLATE() {
        return this.all.get('CHOCOLATE')![0];
    }

    static get SADDLEBROWN() {
        return this.all.get('SADDLEBROWN')![0];
    }

    static get SIENNA() {
        return this.all.get('SIENNA')![0];
    }

    static get BROWN() {
        return this.all.get('BROWN')![0];
    }

    static get MAROON() {
        return this.all.get('MAROON')![0];
    }

    static get WHITE() {
        return this.all.get('WHITE')![0];
    }

    static get SNOW() {
        return this.all.get('SNOW')![0];
    }

    static get HONEYDEW() {
        return this.all.get('HONEYDEW')![0];
    }

    static get MINTCREAM() {
        return this.all.get('MINTCREAM')![0];
    }

    static get AZURE() {
        return this.all.get('AZURE')![0];
    }

    static get ALICEBLUE() {
        return this.all.get('ALICEBLUE')![0];
    }

    static get GHOSTWHITE() {
        return this.all.get('GHOSTWHITE')![0];
    }

    static get WHITESMOKE() {
        return this.all.get('WHITESMOKE')![0];
    }

    static get SEASHELL() {
        return this.all.get('SEASHELL')![0];
    }

    static get BEIGE() {
        return this.all.get('BEIGE')![0];
    }

    static get OLDLACE() {
        return this.all.get('OLDLACE')![0];
    }

    static get FLORALWHITE() {
        return this.all.get('FLORALWHITE')![0];
    }

    static get IVORY() {
        return this.all.get('IVORY')![0];
    }

    static get ANTIQUEWHITE() {
        return this.all.get('ANTIQUEWHITE')![0];
    }

    static get LINEN() {
        return this.all.get('LINEN')![0];
    }

    static get LAVENDERBLUSH() {
        return this.all.get('LAVENDERBLUSH')![0];
    }

    static get MISTYROSE() {
        return this.all.get('MISTYROSE')![0];
    }

    static get GAINSBORO() {
        return this.all.get('GAINSBORO')![0];
    }

    static get LIGHTGRAY() {
        return this.all.get('LIGHTGRAY')![0];
    }

    static get SILVER() {
        return this.all.get('SILVER')![0];
    }

    static get DARKGRAY() {
        return this.all.get('DARKGRAY')![0];
    }

    static get GRAY() {
        return this.all.get('GRAY')![0];
    }

    static get DIMGRAY() {
        return this.all.get('DIMGRAY')![0];
    }

    static get LIGHTSLATEGRAY() {
        return this.all.get('LIGHTSLATEGRAY')![0];
    }

    static get SLATEGRAY() {
        return this.all.get('SLATEGRAY')![0];
    }

    static get DARKSLATEGRAY() {
        return this.all.get('DARKSLATEGRAY')![0];
    }

    static get BLACK() {
        return this.all.get('BLACK')![0];
    }
    //#endregion
}