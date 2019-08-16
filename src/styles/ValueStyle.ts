import _ from "lodash";
import { IFeature } from "ginkgoch-geom";
import { Render } from "../render";
import { JsonKnownTypes } from "../shared/JsonUtils";
import { PointSymbolType, Style, PointStyle, StyleUtils, FillStyle, LineStyle } from ".";

export class ValueStyle extends Style {
    items: ValueItem[];
    field: string;

    constructor(field?: string, items?: ValueItem[]) {
        super();

        this.name = 'Value Style';
        this.type = JsonKnownTypes.valueStyle;
        this.items = new Array<ValueItem>();
        items && items.forEach(item => {
            this.items.push(item);
        });

        this.field = field || '';
    }

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

    static auto(styleType: 'fill' | 'linear' | 'point', field: string, values: any[], fromColor?: string, toColor?: string, strokeColor?: string, strokeWidth = 1, radius = 12, symbol: PointSymbolType = 'default') {
        switch (styleType) {
            case 'point':
                return this._auto(field, values, fromColor, toColor, (c, v) => {
                    const style = new PointStyle(c, strokeColor, strokeWidth, radius, symbol);
                    style.name = v;
                    return style;
                });
            case 'fill':
                return this._auto(field, values, fromColor, toColor, (c, v) => {
                    const style = new FillStyle(c, strokeColor, strokeWidth);
                    style.name = v;
                    return style;
                });
            case 'linear':
                return this._auto(field, values, fromColor, toColor, (c, v) => {
                    const style = new LineStyle(c, strokeWidth);
                    style.name = v;
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

export interface ValueItem {
    value: any;
    style: Style;
}