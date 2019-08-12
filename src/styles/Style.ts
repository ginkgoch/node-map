import _ from "lodash";
import { Render } from "../render";
import { IFeature } from "ginkgoch-geom";

export abstract class Style {
    name: string;
    maximumScale: number;
    minimumScale: number;

    constructor(name?: string) {
        this.name = name || 'unknown';
        this.maximumScale = Number.POSITIVE_INFINITY;
        this.minimumScale = 0;
    }

    fields(): string[] {
        return [];
    }

    draw(feature: IFeature, render: Render) {
        this.drawAll([feature], render);
    }

    drawAll(features: IFeature[], render: Render) {
        if (render.scale < this.minimumScale || render.scale > this.maximumScale) {
            return;
        }

        const styleJson = this.json();
        this._draw(features, styleJson, render);
    }

    /**
     * 
     * @param feature 
     * @param styleJson 
     * @param render 
     * @virtual
     */
    protected _draw(features: IFeature[], styleJson: any, render: Render) {
        features.forEach(f => render.drawFeature(f, styleJson));
    }

    json(): any {
        let json = this._json();
        return json;
    }

    /**
     * @virtual
     */
    protected _json(): any {
        const raw: any = {};
        _.forIn(this, (v, k) => {
            if (typeof v !== 'function' && k !== 'name' && v !== undefined) {
                raw[k] = v;
            }
        });

        return raw;
    }
}