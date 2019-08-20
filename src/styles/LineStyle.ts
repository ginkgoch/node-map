import { Style } from "./Style";
import { StyleUtils } from "./StyleUtils";
import { JSONKnownTypes } from "../shared/JSONUtils";

export class LineStyle extends Style {
    strokeStyle: string;
    lineWidth: number;

    constructor(strokeStyle?: string, lineWidth = 2, name?: string) {
        super();

        this.name = name || 'Line Style';
        this.type = JSONKnownTypes.lineStyle;
        this.strokeStyle = StyleUtils.colorOrRandomDark(strokeStyle);
        this.lineWidth = lineWidth;
    }

    protected _propKeys(): string[] {
        return [
            'strokeStyle',
            'lineWidth'
        ];
    }
}