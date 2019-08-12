import { Style } from "./Style";
import { StyleUtils } from "./StyleUtils";
import { PointSymbolType } from "./PointStyle";

export class GeneralStyle extends Style {
    fillStyle: string;
    lineWidth: number;
    strokeStyle: string;
    symbol: PointSymbolType;

    constructor(fillStyle?: string, strokeStyle?: string, lineWidth = 1) {
        super();

        this.name = 'General Style';
        this.lineWidth = lineWidth;
        this.fillStyle = StyleUtils.colorOrRandomDark(fillStyle);
        this.strokeStyle = strokeStyle || this.fillStyle;
        this.symbol = 'circle';
    }
}