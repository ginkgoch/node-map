import { Style } from "./Style";
import { StyleUtils } from "./StyleUtils";
import _ from "lodash";
import { StyleTypes } from "./StyleTypes";

export class FillStyle extends Style {
    fillStyle: string;
    lineWidth: number;
    strokeStyle: string;

    constructor(fillStyle?: string, strokeStyle?: string, lineWidth = 2) {
        super();

        this.name = 'Fill Style';
        this.type = StyleTypes.fill;
        this.lineWidth = lineWidth;
        this.fillStyle = StyleUtils.colorOrRandomLight(fillStyle);
        this.strokeStyle = StyleUtils.colorOrRandomDark(strokeStyle);
    }

    protected _propKeys(): string[] {
        return ['fillStyle', 'lineWidth', 'strokeStyle'];
    }
}