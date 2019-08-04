import randomColor from 'randomcolor';

export class StyleUtils {
    static colorOrRandom(color?: string, option?: ColorOptions): string {
        if (color !== undefined) return color;

        return <string>randomColor(option || {
            luminosity: 'light',
            hue: 'random'
        });
    }

    static colorOrRandomDark(color?: string) {
        return StyleUtils.colorOrRandom(color, {
            luminosity: 'dark'
        });
    }

    static colorOrRandomLight(color?: string) {
        return StyleUtils.colorOrRandom(color, {
            luminosity: 'light'
        });
    }
}

export interface ColorOptions extends RandomColorOptions { }