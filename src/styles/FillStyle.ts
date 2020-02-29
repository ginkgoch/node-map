import _ from "lodash";
import { Style } from "./Style";
import { StyleUtils } from "./StyleUtils";
import { JSONKnownTypes } from "../shared/JSONUtils";
import { IFeature, GeometryType } from "ginkgoch-geom";
import { Image } from "../render";

/** @category styles  */
export type FillPatternRepeat = 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat';

/** @category styles  */
export interface FillPattern {
    image: Image,
    repeat?: FillPatternRepeat
}

/**
 * This class represents a style for an area based geometries (e.g. polygon, multi-polygon) only.
 * @category styles 
 */
export class FillStyle extends Style {
    /** 
     * The fill style with color or pattern. 
     * e.g. '#cccccc' | 'gray' | { image: new Image('pattern.png'), repeat: 'repeat' } 
     * */
    fillStyle: string | FillPattern;
    /** The stroke width in pixel. */
    lineWidth: number;
    /** The stroke color string. e.g. "#000000" or "black" */
    strokeStyle: string;
    /** The line dash array. e.g. [4, 4] */
    lineDash?: Array<number>;

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
        return ['fillStyle', 'lineWidth', 'strokeStyle', 'lineDash'];
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