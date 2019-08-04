import { Style } from "./Style";
import { StyleUtils } from "./StyleUtils";

export class LineStyle extends Style {
    strokeStyle: string;
    lineWidth: number;

    constructor(strokeStyle?: string, lineWidth = 2) {
        super();

        this.name = 'Line Style';
        this.strokeStyle = StyleUtils.colorOrRandomDark(strokeStyle);
        this.lineWidth = lineWidth;
    }
}