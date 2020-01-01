import { Colors, RandomColorOption, RandomLuminosity } from './Colors';

/** This class represents an internal utilities to generate random colors and related resources for styles. */
export class StyleUtils {
    /** Gets a color or random color if not specified. */
    static colorOrRandom(color?: string, option?: RandomColorOption): string {
        if (color !== undefined) return color;

        return <string>Colors.random(option || {
            luminosity: RandomLuminosity.light,
            hue: RandomLuminosity.dark
        });
    }

    /** Gets a color or random color in dark color family if not specified. */
    static colorOrRandomDark(color?: string) {
        return StyleUtils.colorOrRandom(color, {
            luminosity: RandomLuminosity.dark
        });
    }

    /** Gets a color or random color in light color family if not specified. */
    static colorOrRandomLight(color?: string) {
        return StyleUtils.colorOrRandom(color, {
            luminosity: RandomLuminosity.light
        });
    }

    /**
     * Gets a color arrays between two colors.
     * @param {color} count The color count to generate.
     * @param {string} fromColor The color begins from. Optional with default value - a random color.
     * @param {string} toColor The color ends with. Optional with default value - a random color.
     * @returns {Array<string>} A color list between the two colors.
     */
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