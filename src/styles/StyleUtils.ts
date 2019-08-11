import { Colors, RandomColorOption, RandomLuminosity } from './Colors';

export class StyleUtils {
    static colorOrRandom(color?: string, option?: RandomColorOption): string {
        if (color !== undefined) return color;

        return <string>Colors.random(option || {
            luminosity: RandomLuminosity.light,
            hue: RandomLuminosity.dark
        });
    }

    static colorOrRandomDark(color?: string) {
        return StyleUtils.colorOrRandom(color, {
            luminosity: RandomLuminosity.dark
        });
    }

    static colorOrRandomLight(color?: string) {
        return StyleUtils.colorOrRandom(color, {
            luminosity: RandomLuminosity.light
        });
    }
}