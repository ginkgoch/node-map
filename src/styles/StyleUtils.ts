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

    static colorsBetween(count: number, fromColor?: string, toColor?: string) {
        let colors = new Array<string>();
        if (fromColor === undefined && toColor === undefined) {
            for (let i = 0; i < count; i++) {
                colors.push(Colors.random() as string);
            }
        } else if (toColor === undefined) {
            Colors.forward(<string>fromColor, count, 100).forEach(c => colors.push(c));
        } else if (fromColor === undefined) {
            Colors.backward(<string>toColor, count, 100).forEach(c => colors.push(c));
        } else {
            Colors.between(fromColor, toColor, count).forEach(c => colors.push(c));
        }

        return colors;
    }
}