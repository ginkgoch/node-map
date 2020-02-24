import _ from "lodash";
import { IFeature } from "ginkgoch-geom";
import { Render } from "../render";
import { Constants } from "../shared";
import { JSONKnownTypes } from "../shared/JSONUtils";
import { Style, PointSymbolType, PointStyle, FillStyle, LineStyle, StyleUtils, AutoStyleOptions } from ".";
import { PropertyAggregator } from "../layers";

const DEFAULT_AUTO_STYLE_OPTIONS = Constants.DEFAULT_AUTO_STYLE_OPTIONS;

/**
 * This class represents a style to render different sub-styles based on the break down values.
 */
export class ClassBreakStyle extends Style {
    /**
     * The field name where to fetch the values to break down.
     */
    field: string;
    /**
     * classBreaks The break down sub-styles and its corresponding value.
     */
    classBreaks: Array<ClassBreakItem>;

    /**
     * Constructs a class break style instance.
     * @param {string} field The field name where to fetch the values to break down.
     * @param {Array<ClassBreakItem>} classBreaks The break down sub-styles and its corresponding value.
     * @param {string} name The name of this style.
     */
    constructor(field?: string, classBreaks?: Array<ClassBreakItem>, name?: string) {
        super();

        this.name = name || 'Class Break Style';
        this.type = JSONKnownTypes.classBreakStyle;
        this.field = field || '';
        this.classBreaks = new Array<ClassBreakItem>();

        if (classBreaks !== undefined) {
            classBreaks.forEach(cb => this.classBreaks.push(cb));
        }
    }

    /**
     * Collects the required field names that will be used for rendering.
     */
    fields() {
        let fields = [];
        if (this.field && this.field !== '') {
            fields.push(this.field);
        }

        fields = _.chain(this.classBreaks)
            .flatMap(item => item.style.fields())
            .concat(fields)
            .uniq()
            .value();

        return fields;
    }

    /**
     * The concrete draw process.
     * @param {IFeature[]} features The features to draw. 
     * @param {any} styleJson The raw HTML style.
     * @param {Render} render The renderer to draw.
     */
    protected _draw(features: IFeature[], styleJson: any, render: Render) {
        features.forEach(f => {
            this._drawFeature(f, render);
        });
    }

    private _drawFeature(f: IFeature, render: Render) {
        if (!f.properties.has(this.field)) {
            return;
        }

        const value = f.properties.get(this.field);
        const styles = this.classBreaks
            .filter(cb => value >= cb.minimum && value < cb.maximum)
            .map(cb => cb.style);

        styles.forEach(s => s.draw(f, render));
    }

    /**
     * This is a shortcut function to automatically generate class breaks based on the values, 
     * and assign a gradient colors to each item.
     * @deprecated Use `autoByRange` function instead.
     * @param {'fill'|'linear'|'point'} styleType The style type of the sub-styles.
     * @param {string} field The field name where the value is fetched. 
     * @param {number} maximum The maximum value to break down. 
     * @param {number} minimum The minimum value to break down. 
     * @param {number} count The break down items count to generate. 
     * @param {string} fromColor The fill color begins from.
     * @param {string} toColor The fill color ends with. 
     * @param {string} strokeColor The stroke color.
     * @param {number} strokeWidth The stroke width in pixel. 
     * @param {number} radius The radius for points symbols. 
     * @param {PointSymbolType} symbol The point symbol type.
     * @returns {ClassBreakStyle} A class break style with sub styles filled with the specified conditions. 
     */
    static auto(styleType: 'fill' | 'linear' | 'point', field: string, maximum: number, minimum: number, count: number,
        fromColor?: string, toColor?: string, strokeColor?: string,
        strokeWidth = 1, radius = 12, symbol: PointSymbolType = 'default') {
        switch (styleType) {
            case 'point':
                return this._auto(field, maximum, minimum, count, fromColor, toColor, (c, min, max) => {
                    const style = new PointStyle(c, strokeColor, strokeWidth, radius, symbol);
                    style.name = this.subStyleName(min, max);
                    return style;
                });
            case 'fill':
                return this._auto(field, maximum, minimum, count, fromColor, toColor, (c, min, max) => {
                    const style = new FillStyle(c, strokeColor, strokeWidth);
                    style.name = this.subStyleName(min, max);
                    return style;
                });
            case 'linear':
                return this._auto(field, maximum, minimum, count, fromColor, toColor, (c, min, max) => {
                    const style = new LineStyle(c, strokeWidth);
                    style.name = this.subStyleName(min, max);
                    return style;
                });
        }
    }

    /**
     * This is a shortcut function to automatically generate class breaks based on the values, 
     * and assign a gradient colors to each item.
     * @param {'fill'|'linear'|'point'} styleType The style type of the sub-styles.
     * @param {string} field The field name where the value is fetched. 
     * @param {number} maximum The maximum value to break down. 
     * @param {number} minimum The minimum value to break down. 
     * @param {number} count The break down items count to generate.
     * @param {AutoStyleOptions} autoStyleOptions The auto style options.
     * @returns {ClassBreakStyle} A class break style with sub styles filled with the specified conditions.
     */
    static autoByRange(styleType: 'fill' | 'linear' | 'point', field: string, maximum: number, minimum: number, count: number, autoStyleOptions?: AutoStyleOptions): ClassBreakStyle {
        let options = _.defaults(autoStyleOptions, DEFAULT_AUTO_STYLE_OPTIONS);

        let styleFn: (color: string, min: number, max: number) => Style;
        switch (styleType) {
            case 'point':
                styleFn = (c, min, max) => {
                    const style = new PointStyle(c, options.strokeColor, options.strokeWidth, options.radius, options.symbol);
                    style.name = this.subStyleName(min, max);
                    return style;
                };
                break;
            case 'fill':
                styleFn = (c, min, max) => {
                    const style = new FillStyle(c, options.strokeColor, options.strokeWidth);
                    style.name = this.subStyleName(min, max);
                    return style;
                };
                break;
            case 'linear':
                styleFn = (c, min, max) => {
                    const style = new LineStyle(c, options.strokeWidth);
                    style.name = this.subStyleName(min, max);
                    return style;
                };
                break;
            default:
                throw new Error(`Unsupported style type ${styleType}`);
        }

        return this._auto(field, maximum, minimum, count, options.fromColor, options.toColor, styleFn);
    }

    private static _auto(field: string, maximum: number, minimum: number, count: number, fromColor?: string, toColor?: string,
        styleFn?: (color: string, min: number, max: number) => Style) {
        const breakIncrement = Math.abs(maximum - minimum) / count;

        const colors = StyleUtils.colorsBetween(count, fromColor, toColor);
        const style = new ClassBreakStyle(field);
        for (let i = 0; i < count; i++) {
            if (styleFn === undefined) break;

            let breakMin = minimum + i * breakIncrement;
            let breakMax = breakMin + breakIncrement;
            if (i === 0) {
                breakMin = 0;
            }

            if (i === count - 1) {
                breakMax = Constants.POSITIVE_INFINITY_SCALE;
            }

            const subStyle = styleFn(colors[i], breakMin, breakMax);
            style.classBreaks.push({ minimum: breakMin, maximum: breakMax, style: subStyle });
        }

        return style;
    }

    static autoByAggregator(styleType: 'fill' | 'linear' | 'point', field: string,
        aggregator: PropertyAggregator, breakCount: number, breakBy?: 'value' | 'position',
        autoStyleOptions?: AutoStyleOptions) {
        let breakDownValues = aggregator.breakDownValues(field, breakCount, breakBy);
        return this.autoByValues(styleType, field, breakDownValues, autoStyleOptions);
    }

    static autoByValues(styleType: 'fill' | 'linear' | 'point', field: string,
        breakDownValues: Array<Range>, autoStyleOptions?: AutoStyleOptions) {
        let options = _.defaults(autoStyleOptions, DEFAULT_AUTO_STYLE_OPTIONS);

        let styleFn: ((color: string, min: number, max: number) => Style) | undefined = undefined;
        switch (styleType) {
            case 'point':
                styleFn = (c, min, max) => {
                    const style = new PointStyle(c, options.strokeColor, options.strokeWidth, options.radius, options.symbol);
                    style.name = this.subStyleName(min, max);
                    return style;
                }; break;
            case 'fill':
                styleFn = (c, min, max) => {
                    const style = new FillStyle(c, options.strokeColor, options.strokeWidth);
                    style.name = this.subStyleName(min, max);
                    return style;
                }; break;
            case 'linear':
                styleFn = (c, min, max) => {
                    const style = new LineStyle(c, options.strokeWidth);
                    style.name = this.subStyleName(min, max);
                    return style;
                }; break;
            default:
                throw new Error(`Unsupported style type: ${styleType}`);
        }

        return this._autoByValues(field, breakDownValues, options.fromColor, options.toColor, styleFn);
    }

    private static _autoByValues(field: string, breakDownValues: Array<Range>, fromColor?: string, toColor?: string, func?: (color: string, min: number, max: number) => Style) {
        const count = breakDownValues.length;
        const colors = StyleUtils.colorsBetween(count, fromColor, toColor);
        const style = new ClassBreakStyle(field);

        for (let i = 0; i < count; i++) {
            if (func === undefined) break;

            let { minimum, maximum } = breakDownValues[i];
            const subStyle = func(colors[i], minimum, maximum);
            style.classBreaks.push({ minimum, maximum, style: subStyle });
        }

        return style;
    }

    private static subStyleName(min: number, max: number) {
        return `${min} ~ ${max >= Constants.POSITIVE_INFINITY_SCALE ? '∞' : max}`;
    }
}

/**
 * This interface represents a structure of a class break item.
 */
export interface ClassBreakItem extends Range {
    style: Style
}

export interface Range {
    minimum: number,
    maximum: number
}