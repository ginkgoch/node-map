import { Style } from "./Style";
import { StyleUtils } from "./StyleUtils";
import { PointSymbolType } from "./PointStyle";
import { JSONKnownTypes } from "../shared/JSONUtils";
import { FillPattern } from "./FillStyle";

/**
 * This class represents a general style regardless the geometry type to draw.
 */
export class GeneralStyle extends Style {
    /** 
     * The fill style with color or pattern. 
     * e.g. '#cccccc' | 'gray' | { image: new Image('pattern.png'), repeat: 'repeat' } 
     * */
    fillStyle: string | FillPattern;
    /** The stroke width in pixel. */
    lineWidth: number;
    /** The stroke color string. e.g. "#000000" or "black". */
    strokeStyle: string;
    /** The symbol type for point geometry. */
    symbol: PointSymbolType;
    /** The radius width in pixel for point geometry. */
    radius: number;
    /** The line dash array. e.g. [4, 4] */
    lineDash?: Array<number>;

    /** Constructs a general style instance that regardless the geometry type to draw. */
    constructor(fillStyle?: string | FillPattern, strokeStyle?: string, lineWidth = 1, radius = 12, symbol: PointSymbolType = 'default', name?: string) {
        super();

        this.name = name || 'General Style';
        this.type = JSONKnownTypes.generalStyle;
        this.lineWidth = lineWidth;

        this.fillStyle = fillStyle || StyleUtils.colorOrRandomDark(fillStyle);
        this.strokeStyle = strokeStyle || 'transparent';
        this.symbol = symbol;
        this.radius = radius;
    }

    /**
     * Collects the raw HTML style keys that will be included in the returning raw styles.
     */
    protected _htmlStyleKeys(): string[] {
        return [
            'fillStyle',
            'lineWidth',
            'strokeStyle',
            'symbol',
            'radius',
            'lineDash'
        ];
    }
}