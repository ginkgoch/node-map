import { Style } from "./Style";
import { StyleUtils } from "./StyleUtils";

export class PointStyle extends Style {
    fillStyle: string;
    strokeStyle: string;
    lineWidth: number;
    radius: number;
    symbol: 'default' | 'rect' | 'square' | 'circle' = 'default';

    constructor(fillStyle?: string, 
        strokeStyle?: string, 
        lineWidth: number = 2, 
        radius: number = 12, 
        symbol: 'default' | 'rect' | 'square' | 'circle' = 'default') {

        super();

        this.name = 'Point Style';
        this.fillStyle = StyleUtils.colorOrRandomLight(fillStyle);
        this.strokeStyle = StyleUtils.colorOrRandomDark(strokeStyle);
        this.lineWidth = lineWidth;
        this.radius = radius;
        this.symbol = symbol;
    }
}