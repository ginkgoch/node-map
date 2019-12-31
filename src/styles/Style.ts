import _ from "lodash";
import { Render } from "../render";
import { IFeature } from "ginkgoch-geom";
import { Constants } from "../shared";
import { JSONUtils, JSONKnownTypes } from "../shared/JSONUtils";
import uuid from "../shared/UUID";

/**
 * This class represents a base class of all styles.
 * @abstract
 */
export abstract class Style {
    /**
     * @property {string} id The id of this style. Default value is `style-${uuid()}`.
     */
    id: string;
    /**
     * @property {string} type The geometry type that is proper for this style. e.g. Polygon is proper for FillStyle, not proper for polyline.
     */
    type: string;
    /**
     * @property {string} name The name of this style.
     */
    name: string;
    /**
     * @property {number} maximumScale The maximum visible scale for drawing this style.
     */
    maximumScale: number;
    /**
     * @property {number} minimumScale The minimum visible scale for drawing this style.
     */
    minimumScale: number;
    /**
     * @property {boolean} visible The main visible switcher of this style.
     */
    visible = true;

    /**
     * Represents the default implementation of base style class. The following items are set as default values.
     * 1. id = `style-${uuid()}`
     * 2. maximumScale = positive_infinity
     * 3. minimumScale = 0
     * @param {string} name The name of this style. Optional with default name `unknown`.
     */
    constructor(name?: string) {
        this.id = 'style-' + uuid();
        this.type = JSONKnownTypes.unknown;
        this.name = name || 'unknown';
        this.maximumScale = Constants.POSITIVE_INFINITY_SCALE;
        this.minimumScale = 0;
    }

    /**
     * Collects the required field names that will be used for rendering.
     */
    fields(): string[] {
        return [];
    }

    /**
     * Draws a feature with this style.
     * @param {IFeature} feature The feature to draw.
     * @param {Render} render The renderer to draw.
     */
    draw(feature: IFeature, render: Render) {
        this.drawAll([feature], render);
    }

    /**
     * Draws multiple features with this style.
     * @param {IFeature[]} features The features to draw.
     * @param {Render} render The renderer to draw.
     */
    drawAll(features: IFeature[], render: Render) {
        if (!this.visible || render.scale < this.minimumScale || render.scale > this.maximumScale) {
            return;
        }

        const styleJson = this.props();
        this._draw(features, styleJson, render);
    }

    /**
     * The concrete draw process.
     * @param {IFeature[]} features The features to draw. 
     * @param {any} styleJson The raw HTML style.
     * @param {Render} render The renderer to draw.
     * @virtual
     * @protected
     */
    protected _draw(features: IFeature[], styleJson: any, render: Render) {
        features.forEach(f => render.drawFeature(f, styleJson));
    }

    /**
     * Converts this style to a JSON format data.
     * @returns {any} The JSON format data.
     */
    toJSON(): any {
        let json = this._toJSON();
        return json;
    }

    /**
     * Converts this style to a JSON format data.
     * @returns {any} The JSON format data.
     * @protected
     */
    protected _toJSON() {
        let json = JSONUtils.objectToJSON(this);
        return json;
    }

    /**
     * @deprecated Use raw() instead.
     */
    props(): any {
        let props = this._props();
        return props;
    }

    /**
     * @deprecated Use _raw() instead.
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

    /**
     * @deprecated Use _rawKeys() instead.
     */
    protected _propKeys(): string[] {
        return [];
    }

    /**
     * Collects all the necessary raw HTML style that will be used.
     */
    raw(): any {
        let props = this._props();
        return props;
    }

    /**
     * Collects all the necessary raw HTML style that will be used.
     */
    protected _raw(): any {
        const raw: any = {};
        _.forIn(this, (v, k) => {
            if (this._propKeys().some(key => key === k)) {
                raw[k] = v;
            }
        });

        return raw;
    }

    /**
     * Collects the raw HTML style keys that will be included in the returning raw styles.
     */
    protected _rawKeys(): string[] {
        return [];
    }
}