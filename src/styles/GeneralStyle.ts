import { Style } from "./Style";
import { StyleUtils } from "./StyleUtils";
import { PointSymbolType } from "./PointStyle";
import { JSONKnownTypes } from "../shared/JSONUtils";

export class GeneralStyle extends Style {
    fillStyle: string;
    lineWidth: number;
    strokeStyle: string;
    symbol: PointSymbolType;
    radius: number;

    constructor(fillStyle?: string, strokeStyle?: string, lineWidth = 1, radius = 12, symbol: PointSymbolType = 'default') {
        super();

        this.name = 'General Style';
        this.type = JSONKnownTypes.generalStyle;
        this.lineWidth = lineWidth;
        this.fillStyle = StyleUtils.colorOrRandomDark(fillStyle);
        this.strokeStyle = strokeStyle || this.fillStyle;
        this.symbol = symbol;
        this.radius = radius;
    }

    protected _propKeys(): string[] {
        return [
            'fillStyle',
            'lineWidth',
            'strokeStyle',
            'symbol',
            'radius'
        ];
    }
}