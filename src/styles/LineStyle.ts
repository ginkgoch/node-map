import { Style } from "./Style";
import { StyleUtils } from "./StyleUtils";
import { JSONKnownTypes } from "../shared/JSONUtils";

/** 
 * This class represents a line style. 
 */
export class LineStyle extends Style {
    /** The stroke color string. e.g. "000000" or "black" */
    strokeStyle: string;
    /** The stroke width in pixel. */
    lineWidth: number;

    /** Constructs a line style instance. */
    constructor(strokeStyle?: string, lineWidth = 2, name?: string) {
        super();

        this.name = name || 'Line Style';
        this.type = JSONKnownTypes.lineStyle;
        this.strokeStyle = StyleUtils.colorOrRandomDark(strokeStyle);
        this.lineWidth = lineWidth;
    }

    /**
     * Collects the raw HTML style keys that will be included in the returning raw styles.
     */
    protected _htmlStyleKeys(): string[] {
        return [
            'strokeStyle',
            'lineWidth'
        ];
    }
}