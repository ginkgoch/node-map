import _ from "lodash";
import { IFeature, Point, MultiPoint, GeometryCollection, Geometry } from "ginkgoch-geom";

import { Style } from "./Style";
import { Image, Render } from "../render";
import { JSONKnownTypes } from "../shared/JSONUtils";

/** This class represents an icon style to draw icons on map. */
export class IconStyle extends Style {
    /** The image source to draw. */
    icon: Image;
    /** The horizontal offset to draw. */
    offsetX: number;
    /** The vertical offset to draw. */
    offsetY: number;

    /**
     * Constructs an icon style instance.
     * @param {Image} icon The image source to draw.
     * @param {number} offsetX The horizontal offset to draw.
     * @param {number} offsetY The vertical offset to draw. 
     * @param {string} name The name of this style.
     */
    constructor(icon?: Image, offsetX = 0, offsetY = 0, name?: string) {
        super();

        this.name = name || 'Icon Style';
        this.type = JSONKnownTypes.iconStyle;
        this.icon = icon || new Image();
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }

    /**
     * The concrete draw process.
     * @param {IFeature[]} features The features to draw. 
     * @param {any} styleJson The raw HTML style.
     * @param {Render} render The renderer to draw.
     * @override
     * @protected
     */
    protected _draw(features: IFeature[], styleJson: any, render: Render) {
        features.forEach(f => {
            const geom = f.geometry;
            this._drawIconForGeom(geom, styleJson, render);
        });
    }

    private _drawIconForGeom(geom: Geometry, styleJson: any, render: Render) {
        if (geom instanceof Point) {
            render.drawIcon(this.icon, geom, styleJson);
        } else if (geom instanceof MultiPoint) {
            geom.children.forEach(c => {
                render.drawIcon(this.icon, c, styleJson);
            });
        } else if (geom instanceof GeometryCollection) {
            geom.children.forEach(g => {
                this._drawIconForGeom(g, styleJson, render);
            });
        }
    }

    /**
     * Collects all the necessary raw HTML style that will be used.
     * @override
     */
    protected _htmlStyle(): any {
        let json = super._htmlStyle();
        json = _.pickBy(json, (v, k) => {
            if (k === 'offsetX' && v === 0) return false;
            if (k === 'offsetY' && v === 0) return false;
            if (k === 'icon') return false;
            return true;
        });

        return json;
    }

    /**
     * Collects the raw HTML style keys that will be included in the returning raw styles.
     * @override
     */
    protected _htmlStyleKeys(): string[] {
        return [
            'offsetX',
            'offsetY',
            'icon'
        ];
    }
}