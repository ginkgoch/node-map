import { Style } from "./Style";
import { Image, Render } from "../render";
import _ from "lodash";
import { IFeature, Point, MultiPoint, GeometryCollection, Geometry } from "ginkgoch-geom";

export class IconStyle extends Style {
    icon: Image;
    offsetX: number;
    offsetY: number;

    constructor(icon: Image, offsetX = 0, offsetY = 0) {
        super();

        this.name = 'Icon Style';
        this.icon = icon;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
    }

    protected _draw(feature: IFeature, styleJson: any, render: Render) {
        const geom = feature.geometry;
        this._drawIconForGeom(geom, styleJson, render);
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

    protected _json(): any {
        let json = super._json();
        json = _.pickBy(json, (v, k) => {
            if (k === 'offsetX' && v === 0) return false;
            if (k === 'offsetY' && v === 0) return false;
            if (k === 'icon') return false;
            return true;
        });
    }
}