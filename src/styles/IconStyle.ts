import { Style } from "./Style";
import { Image, Render } from "../render";
import _ from "lodash";
import { IFeature, Point, MultiPoint, GeometryCollection, Geometry } from "ginkgoch-geom";
import { JsonKnownTypes } from "../shared/JsonUtils";

export class IconStyle extends Style {
    icon: Image;
    offsetX: number;
    offsetY: number;

    constructor(icon: Image, offsetX = 0, offsetY = 0) {
        super();

        this.name = 'Icon Style';
        this.type = JsonKnownTypes.iconStyle;
        this.icon = icon;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }

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

    protected _props(): any {
        let json = super._props();
        json = _.pickBy(json, (v, k) => {
            if (k === 'offsetX' && v === 0) return false;
            if (k === 'offsetY' && v === 0) return false;
            if (k === 'icon') return false;
            return true;
        });

        return json;
    }

    protected _propKeys(): string[] {
        return [
            'offsetX',
            'offsetY',
            'icon'
        ];
    }
}