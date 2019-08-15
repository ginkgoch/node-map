import { Style } from "./Style";
import { StyleUtils } from "./StyleUtils";
import { JsonKnownTypes } from "../shared/JsonUtils";

export class LineStyle extends Style {
    strokeStyle: string;
    lineWidth: number;

    constructor(strokeStyle?: string, lineWidth = 2) {
        super();

        this.name = 'Line Style';
        this.type = JsonKnownTypes.lineStyle;
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