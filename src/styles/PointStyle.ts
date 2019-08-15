import { Style } from "./Style";
import { StyleUtils } from "./StyleUtils";
import { JsonKnownTypes } from "../shared/JsonUtils";

export class PointStyle extends Style {
    fillStyle: string;
    strokeStyle: string;
    lineWidth: number;
    radius: number;
    symbol: PointSymbolType = 'default';

    constructor(fillStyle?: string, 
        strokeStyle?: string, 
        lineWidth: number = 2, 
        radius: number = 12, 
        symbol: PointSymbolType = 'default') {

        super();

        this.name = 'Point Style';
        this.type = JsonKnownTypes.pointStyle;
        this.fillStyle = StyleUtils.colorOrRandomLight(fillStyle);
        this.strokeStyle = strokeStyle || this.fillStyle;
        this.lineWidth = lineWidth;
        this.radius = radius;
        this.symbol = symbol;
    }

    protected _propKeys(): string[] {
        return [
            'fillStyle',
            'strokeStyle',
            'lineWidth',
            'radius',
            'symbol'
        ];
    }
}

export type PointSymbolType = 'default' | 'rect' | 'square' | 'circle';