import _ from "lodash";
import { Render } from "../render";
import { IFeature } from "ginkgoch-geom";

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
        json = _.pickBy(json, v => v !== undefined);
        return json;
    }

    /**
     * @virtual
     */
    protected _json(): any {
        return {};
    }
}