import _ from "lodash";
import { IFeature } from "ginkgoch-geom";
import { Render } from "../render";
import { JSONKnownTypes } from "../shared/JSONUtils";
import { PointSymbolType, Style, PointStyle, StyleUtils, FillStyle, LineStyle } from ".";

/** This class represents a value style which allows to set various sub-styles based on a field value. */
export class ValueStyle extends Style {
    /** A value item list with the definition of value and its corresponding style. */
    items: ValueItem[];
    /** The field name where the value is fetched from. */
    field: string;

    /** Constructs a value style instance. */
    constructor(field?: string, items?: ValueItem[], name?: string) {
        super();

        this.name = name || 'Value Style';
        this.type = JSONKnownTypes.valueStyle;
        this.items = new Array<ValueItem>();
        items && items.forEach(item => {
            this.items.push(item);
        });

        this.field = field || '';
    }

    /**
     * Collects the required field names that will be used for rendering.
     * @returns {string[]} The required field names that will be used for rendering.
     */
    fields() {
        let fields = [];
        if (this.field && this.field !== '') {
            fields.push(this.field);
        }

        fields = _.chain(this.items)
            .flatMap(item => item.style.fields())
            .concat(fields)
            .uniq()
            .value();

        return fields;
    }

    /**
     * The concrete draw operation.
     * @param {IFeature[]} features The features to draw. 
     * @param {any} styleJson The raw HTML style.
     * @param {Render} render The renderer to draw.
     */
    protected _draw(features: IFeature[], styleJson: any, render: Render) {
        _.groupBy(this.items, i => i.value)
        const itemMap = _.groupBy(this.items, i => i.value);

        features.forEach(f => {
            const v = f.properties.get(this.field);
            if (v === undefined) return;

            const items = itemMap[v];
            items.forEach(i => i.style.draw(f, render));
        });
    }

    /**
     * This is a shortcut function to automatically generate value items based on the distinct values, 
     * and assign a gradient colors to each item.
     * @param {'fill'|'linear'|'point'} styleType The style type of the sub-styles.
     * @param {string} field The field name where the value is fetched. 
     * @param {any[]} values The distinct value array.
     * @param {string} fromColor The fill color begins from.
     * @param {string} toColor The fill color ends with. 
     * @param {string} strokeColor The stroke color.
     * @param {number} strokeWidth The stroke width in pixel. 
     * @param {number} radius The radius for points symbols. 
     * @param {PointSymbolType} symbol The point symbol type.
     * @returns {ValueStyle} A value style with sub styles filled with the specified conditions. 
     */
    static auto(styleType: 'fill' | 'linear' | 'point', field: string, values: any[], fromColor?: string, toColor?: string, strokeColor?: string, strokeWidth = 1, radius = 12, symbol: PointSymbolType = 'default') {
        switch (styleType) {
            case 'point':
                return this._auto(field, values, fromColor, toColor, (c, v) => {
                    const style = new PointStyle(c, strokeColor, strokeWidth, radius, symbol);
                    style.name = `value = ${v}`;
                    return style;
                });
            case 'fill':
                return this._auto(field, values, fromColor, toColor, (c, v) => {
                    const style = new FillStyle(c, strokeColor, strokeWidth);
                    style.name = `value = ${v}`;
                    return style;
                });
            case 'linear':
                return this._auto(field, values, fromColor, toColor, (c, v) => {
                    const style = new LineStyle(c, strokeWidth);
                    style.name = `value = ${v}`;
                    return style;
                });
        }
    }

    private static _auto(field: string, values: any[], fromColor?: string, toColor?: string, func?: (color: string, value: any) => Style) {
        let colors = StyleUtils.colorsBetween(values.length, fromColor, toColor);

        const style = new ValueStyle(field);
        style.items.length = 0;
        for (let i = 0; i < values.length; i++) {
            if (func === undefined) break;

            const subStyle = func(colors[i], values[i]);
            style.items.push({ value: values[i], style: subStyle });
        }

        return style;
    }
}

/** This interface represents a value item structure. */
export interface ValueItem {
    /** The value of this item. */
    value: any;
    /** The style for drawing with this value. */
    style: Style;
}