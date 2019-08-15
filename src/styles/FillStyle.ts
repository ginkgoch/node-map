import { Style } from "./Style";
import { StyleUtils } from "./StyleUtils";
import _ from "lodash";

export class FillStyle extends Style {
    fillStyle: string;
    lineWidth: number;
    strokeStyle: string;

    constructor(fillStyle?: string, strokeStyle?: string, lineWidth = 2) {
        super();

        this.name = 'Fill Style';
        this.lineWidth = lineWidth;
        this.fillStyle = StyleUtils.colorOrRandomLight(fillStyle);
        this.strokeStyle = StyleUtils.colorOrRandomDark(strokeStyle);
    }

    protected _propKeys(): string[] {
        return ['fillStyle', 'lineWidth', 'strokeStyle'];
    }
}