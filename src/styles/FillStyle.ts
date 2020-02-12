import _ from "lodash";
import { Style } from "./Style";
import { StyleUtils } from "./StyleUtils";
import { JSONKnownTypes } from "../shared/JSONUtils";
import { IFeature, GeometryType } from "ginkgoch-geom";
import { Image } from "../render";

export type FillPatternRepeat = 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';

export interface FillPattern {
    image: Image,
    repeat?: FillPatternRepeat
}

/**
 * This class represents a style for an area based geometries (e.g. polygon, multi-polygon) only.
 */
export class FillStyle extends Style {
    fillStyle: string | FillPattern;
    lineWidth: number;
    strokeStyle: string;

    /**
     * Constructs a fill style instance.
     * @param {string | FillPattern} fillStyle The fill color string. 
     * @param {string} strokeStyle The stroke color string.
     * @param {number} lineWidth The stroke width in pixel.
     * @param {string} name The name of this style.
     */
    constructor(fillStyle?: string | FillPattern, strokeStyle?: string, lineWidth = 2, name?: string) {
        super();

        this.name = name || 'Fill Style';
        this.type = JSONKnownTypes.fillStyle;
        this.lineWidth = lineWidth;
        
        this.fillStyle = fillStyle || StyleUtils.colorOrRandomLight(fillStyle);
        this.strokeStyle = StyleUtils.colorOrRandomDark(strokeStyle);
    }

    /**
     * Collects the raw HTML style keys that will be included in the returning raw styles.
     */
    protected _htmlStyleKeys(): string[] {
        return ['fillStyle', 'lineWidth', 'strokeStyle'];
    }

    /**
     * Whether this feature type matches this style.
     * @param {IFeature} feature The feature to match.
     */
    protected _matches(feature: IFeature): boolean {
        const geomType = feature.geometry.type;
        return geomType === GeometryType.Polygon || geomType === GeometryType.MultiPolygon;
    }
}