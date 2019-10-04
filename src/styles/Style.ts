import _ from "lodash";
import { Render } from "../render";
import { IFeature } from "ginkgoch-geom";
import { Constants } from "../shared";
import { JSONUtils, JSONKnownTypes } from "../shared/JSONUtils";
import uuid from "../shared/UUID";

export abstract class Style {
    id: string;
    type: string;
    name: string;
    maximumScale: number;
    minimumScale: number;
    visible = true;

    constructor(name?: string) {
        this.id = 'style-' + uuid();
        this.type = JSONKnownTypes.unknown;
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
        if (!this.visible || render.scale < this.minimumScale || render.scale > this.maximumScale) {
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

    toJSON(): any {
        let json = this._toJSON();
        return json;
    }

    protected _toJSON() {
        let json = JSONUtils.objectToJSON(this);
        return json;
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