import { StyleTypes, PointStyle } from ".";
import { LineStyle } from "./LineStyle";
import { FillStyle } from "./FillStyle";
import { IconStyle } from "./IconStyle";
import { TextStyle } from "./TextStyle";
import { GeneralStyle } from "./GeneralStyle";
import { ValueStyle } from "./ValueStyle";
import { ClassBreakStyle } from "./ClassBreakStyle";
import { Image } from '../render';
import _ from "lodash";

export class StyleFactory {
    private static _deserialize(json: any) {
        const type = this._extractStyleType(json);
        if (typeof type === 'function') {
            const style = new type();
            _.forIn(json, (v, k) => {
                style[k] = this._deserializeValue(v);
            });

            return style;
        } 
        else if (typeof type === 'string' || type === 'image') {
            return new Image(Buffer.from(json.buffer.data));
        }
        else {
            return undefined;
        }
    }

    private static _deserializeValue(json: any): any {
        if (Array.isArray(json)) {
            return json.map(j => this._deserializeValue(j));
        } else if (json === null || json === undefined) {
            return json;
        } else if (json.type !== undefined) {
            return this._deserialize(json);
        } else {
            return json;
        }
    }

    private static _extractStyleType(json: any): any {
        if (json.type !== undefined) {
            switch (json.type) {
                case StyleTypes.point: return PointStyle;
                case StyleTypes.line: return LineStyle;
                case StyleTypes.fill: return FillStyle;
                case StyleTypes.icon: return IconStyle;
                case StyleTypes.text: return TextStyle;
                case StyleTypes.general: return GeneralStyle;
                case StyleTypes.values: return ValueStyle;
                case StyleTypes.classBreaks: return ClassBreakStyle;
                case 'image': return 'image';
                default: 
                    return undefined;
            }
        }
    }
}