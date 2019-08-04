import _ from "lodash";
import { Render } from "../render";
import { IFeature } from "ginkgoch-geom";

//TODO: test whether the context will be recovered.
export abstract class Style {
    name: string
    constructor(name?: string) {
        this.name = name || 'unknown';
    }

    draw(feature: IFeature, render: Render) {
        const styleJson = this.json();
        this._draw(feature, styleJson, render);
    }

    drawAll(features: IFeature[], render: Render) {
        const styleJson = this.json();
        features.forEach(f => this._draw(f, styleJson, render));
    }

    /**
     * 
     * @param feature 
     * @param styleJson 
     * @param render 
     * @virtual
     */
    protected _draw(feature: IFeature, styleJson: any, render: Render) {
        render.drawFeature(feature, styleJson);
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