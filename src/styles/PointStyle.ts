import { Style } from "./Style";
import { StyleUtils } from "./StyleUtils";
import { JSONKnownTypes } from "../shared/JSONUtils";
import { IFeature, GeometryType } from "ginkgoch-geom";

/** This class represents a simple point style to render point based geometries (point, multi-point). */
export class PointStyle extends Style {
    /** The fill color string. e.g. "#ff0000" or "red". */
    fillStyle: string;
    /** The stroke color string. e.g. "#000000" or "black". */
    strokeStyle: string;
    /** The stroke width in pixel. */
    lineWidth: number;
    /** The radius in pixel for drawing circle or rect. */
    radius: number;
    /** The point symbol type. */
    symbol: PointSymbolType = 'default';

    /**
     * Constructs a point style instance.
     * @param {string} fillStyle The fill color string. e.g. "#ff0000" or "red". 
     * @param {string} strokeStyle The stroke color string. e.g. "#000000" or "black". 
     * @param {number} lineWidth The stroke width in pixel. 
     * @param {number} radius The radius in pixel for drawing circle or rect. 
     * @param {PointSymbolType} symbol The point symbol type. 
     * @param {string} name The name of this style.
     */
    constructor(fillStyle?: string, 
        strokeStyle?: string, 
        lineWidth: number = 2, 
        radius: number = 12, 
        symbol: PointSymbolType = 'default', name?: string) {

        super();

        this.name = name || 'Point Style';
        this.type = JSONKnownTypes.pointStyle;
        this.fillStyle = StyleUtils.colorOrRandomLight(fillStyle);
        this.strokeStyle = strokeStyle || this.fillStyle;
        this.lineWidth = lineWidth;
        this.radius = radius;
        this.symbol = symbol;
    }

    /**
     * Collects the raw HTML style keys that will be included in the returning raw styles.
     */
    protected _htmlStyleKeys(): string[] {
        return [
            'fillStyle',
            'strokeStyle',
            'lineWidth',
            'radius',
            'symbol'
        ];
    }

    /**
     * Whether this feature type matches this style.
     * @param {IFeature} feature The feature to match.
     */
    protected _matches(feature: IFeature): boolean {
        const geomType = feature.geometry.type;
        return geomType === GeometryType.Point || geomType === GeometryType.MultiPoint;
    }
}

export type PointSymbolType = 'default' | 'rect' | 'square' | 'circle';