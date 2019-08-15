import { Style } from "./Style";
import { StyleUtils } from "./StyleUtils";
import { IFeature, MultiPoint, MultiPolygon, Point, Polygon, LineString, MultiLineString, GeometryCollectionBase, Geometry, GeometryCollection } from "ginkgoch-geom";
import { Render } from "../render";
import { StyleTypes } from ".";

export class TextStyle extends Style {
    content: string | undefined;
    font: string;
    fillStyle: string;
    textAlign: "start" | "end" | "left" | "right" | "center";
    strokeStyle: string | undefined;
    lineWidth: number;

    constructor(content: string | undefined, fillStyle?: string, font?: string) {
        super();

        this.name = 'Text Style';
        this.type = StyleTypes.text;
        this.content = content;
        this.textAlign = 'center';
        this.font = font || '12px ARIAL';
        this.lineWidth = 0;
        this.fillStyle = StyleUtils.colorOrRandomDark(fillStyle);
    }

    protected _propKeys(): string[] {
        return [
            'font',
            'fillStyle',
            'textAlign',
            'strokeStyle',
            'lineWidth'
        ];
    }

    /**
     * 
     * @param feature 
     * @param styleJson 
     * @param render 
     * @override
     */
    protected _draw(features: IFeature[], styleJson: any, render: Render) {
        if(this.content === undefined) return;

        features.forEach(f => this._drawFeature(f, styleJson, render));
    }

    private _drawFeature(feature: IFeature, styleJson: any, render: Render) {
        const props = this._filterProperties(feature);
        const text = this._formatContent(props);

        const geom = feature.geometry;
        if (geom instanceof MultiPoint) {
            this._drawTextForGeomCollection(geom, text, styleJson, render);
        } else if (geom instanceof MultiPolygon) {
            this._drawTextForGeomCollection(geom, text, styleJson, render);
        } else if (geom instanceof GeometryCollection) {
            this._drawTextForGeomCollection(geom, text, styleJson, render);
        } 
        else if (geom instanceof Point || geom instanceof Polygon) {
            render.drawText(text, geom.centroid(), styleJson);
        } else if (geom instanceof LineString) {
            render.drawTextOnLine(text, geom, styleJson);
        } else if (geom instanceof MultiLineString) {
            geom.children.forEach(l => {
                render.drawTextOnLine(text, l, styleJson);
            });
        }
    }

    /**
     * @override
     */
    fields(): string[] {
        const fields = this._extractFields();
        return fields;
    }

    private _formatContent(props: Map<string, any>) {
        let content = this.content as string;
        props.forEach((v, k) => {
            content = content.replace(`[${ k }]`, v);
        });

        return content;
    }

    private _filterProperties(feature: IFeature) {
        const fields = this._extractFields();
        const props = new Map<string, any>();
        fields.forEach(f => {
            if (feature.properties.has(f)) {
                props.set(f, feature.properties.get(f));
            }
        });

        return props;
    }

    private _extractFields() {
        if (this.content === undefined) return [];

        const fields = this.content.match(/(?!=\[)\w+(?=\])/g);
        return fields || [];
    }

    private _drawTextForGeomCollection<T extends Geometry>(geom: GeometryCollectionBase<T>, text: string, styleJson: any, render: Render) {
        geom.children.forEach(g => {
            render.drawText(text, g.centroid(), styleJson);
        });
    }
}