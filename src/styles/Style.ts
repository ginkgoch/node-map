import _ from "lodash";
import { Render } from "../render";
import { IFeature } from "ginkgoch-geom";
import { StyleTypes } from "./StyleTypes";
import { Constants } from "../shared";

export abstract class Style {
    type: string;
    name: string;
    maximumScale: number;
    minimumScale: number;

    constructor(name?: string) {
        this.type = StyleTypes.unknown;
        this.name = name || 'unknown';
        this.maximumScale = Constants.POSITIVE_INFINITY_SCALE;
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

        const styleJson = this.props();
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

    protected _json() {
        return Style._serialize(this);
    }

    private static _serialize(obj: any) {
        const json: any = {};
        _.forIn(obj, (v, k) => {
            if (typeof v !== 'function' && v !== undefined) {
                json[k] = this._serializeValue(v);
            }
        });

        return json;
    }

    private static _serializeValue(obj: any): any {
        if (obj.json !== undefined || typeof obj.json === 'function') {
            return obj.json();
        } else if (Array.isArray(obj)) {
            return obj.map(o => this._serializeValue(o));
        } else if (typeof obj === 'object') {
            return this._serialize(obj);
        } else {
            return obj;
        }
    }

    props(): any {
        let props = this._props();
        return props;
    }

    /**
     * @virtual
     */
    protected _props(): any {
        const raw: any = {};
        _.forIn(this, (v, k) => {
            if (this._propKeys().some(key => key === k)) {
                raw[k] = v;
            }
        });

        return raw;
    }

    protected _propKeys(): string[] {
        return [];
    }
}