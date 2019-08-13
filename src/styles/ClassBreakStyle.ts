import _ from "lodash";
import { Style, PointSymbolType, Colors, PointStyle, FillStyle, LineStyle } from ".";
import { IFeature } from "ginkgoch-geom";
import { Render } from "../render";
import { GeneralStyle, StyleUtils } from ".";

export class ClassBreakStyle extends Style {
    field: string;
    classBreaks: Array<ClassBreakItem>;

    constructor(field?: string, classBreaks?: Array<ClassBreakItem>) {
        super();

        this.field = field || '';
        this.classBreaks = new Array<ClassBreakItem>();

        if (classBreaks !== undefined) {
            classBreaks.forEach(cb => this.classBreaks.push(cb));
        }
    }

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

    protected _draw(features: IFeature[], styleJson: any, render: Render) {
        features.forEach(f => {
            this._drawFeature(f, styleJson, render);
        });
    }

    private _drawFeature(f: IFeature, styleJson: any, render: Render) {
        if (!f.properties.has(this.field)) {
            return;
        }

        const value = f.properties.get(this.field);
        const styles = this.classBreaks
            .filter(cb => value >= cb.minimum && value < cb.maximum)
            .map(cb => cb.style);

        styles.forEach(s => s.draw(f, render));
    }

    static auto(styleType: 'fill' | 'linear' | 'point', field: string, maximum: number, minimum: number, count: number,
        fromColor?: string, toColor?: string, strokeColor?: string,
        strokeWidth = 1, radius = 12, symbol: PointSymbolType = 'default') {
        switch (styleType) {
            case 'point':
                return this._auto(field, maximum, minimum, count, fromColor, toColor, (c, min, max) => {
                    const style = new PointStyle(c, strokeColor, strokeWidth, radius, symbol);
                    style.name = `${min} ~ ${max}`;
                    return style;
                });
            case 'fill':
                return this._auto(field, maximum, minimum, count, fromColor, toColor, (c, min, max) => {
                    const style = new FillStyle(c, strokeColor, strokeWidth);
                    style.name = `${min} ~ ${max}`;
                    return style;
                });
            case 'linear':
                return this._auto(field, maximum, minimum, count, fromColor, toColor, (c, min, max) => {
                    const style = new LineStyle(c, strokeWidth);
                    style.name = `${min} ~ ${max}`;
                    return style;
                });
        }
    }

    private static _auto(field: string, maximum: number, minimum: number, count: number,
        fromColor?: string, toColor?: string, func?: (color: string, min: number, max: number) => Style) {
        const breakIncrement = Math.abs(maximum - minimum) / count;

        const colors = StyleUtils.colorsBetween(count, fromColor, toColor);
        const style = new ClassBreakStyle(field);
        for (let i = 0; i < count; i++) {
            if (func === undefined) break;

            let breakMin = minimum + i * breakIncrement;
            let breakMax = breakMin + breakIncrement;
            if (i === 0) {
                breakMin = Number.NEGATIVE_INFINITY;
            }

            if (i === count - 1) {
                breakMax = Number.POSITIVE_INFINITY;
            }

            const subStyle = func(colors[i], breakMin, breakMax);
            style.classBreaks.push({ minimum: breakMin, maximum: breakMax, style: subStyle });
        }

        return style;
    }
}

export interface ClassBreakItem {
    minimum: number,
    maximum: number,
    style: Style
}