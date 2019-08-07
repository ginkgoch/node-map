import _ from "lodash";
import { Render } from "../render";
import { IFeature } from "ginkgoch-geom";

//TODO: test whether the context will be recovered.
export abstract class Style {
    name: string;
    maximumScale: number;
    minimumScale: number;

    constructor(name?: string) {
        this.name = name || 'unknown';
        this.maximumScale = Number.POSITIVE_INFINITY;
        this.minimumScale = 0;
    }

    draw(feature: IFeature, render: Render) {
        this.drawAll([feature], render);
    }

    drawAll(features: IFeature[], render: Render) {
        if (render.scale < this.minimumScale || render.scale > this.maximumScale) {
            return;
        }

        const styleJson = this.json();
        features.forEach(f => this._draw(f, styleJson, render));
    }

    fields(): string[] {
        return [];
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