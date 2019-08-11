import _ from "lodash";
import { IFeature } from "ginkgoch-geom";
import { Style } from "./Style";
import { Render } from "../render";

export class ValueStyle extends Style {
    items: ValueItem[];
    field: string;

    constructor(field?: string, items?: ValueItem[]) {
        super();

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

    protected _draw(feature: IFeature, styleJson: any, render: Render) {
        const v = feature.properties.get(this.field);
        if (v === undefined) return;

        const items = this.items.filter(i => i.value === v);
        items.forEach(i => {
            i.style.draw(feature, render);
        });
    }
}

export interface ValueItem {
    value: any;
    style: Style;
}