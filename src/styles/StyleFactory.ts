import _ from "lodash";
import { PointStyle } from ".";
import { LineStyle } from "./LineStyle";
import { Image } from '../render';
import { FillStyle } from "./FillStyle";
import { IconStyle } from "./IconStyle";
import { TextStyle } from "./TextStyle";
import { GeneralStyle } from "./GeneralStyle";
import { ValueStyle } from "./ValueStyle";
import { ClassBreakStyle } from "./ClassBreakStyle";
import { JsonKnownTypes } from "../shared/JsonUtils";

export class StyleFactory {
    static create(styleJson: any) {
        return this._deserialize(styleJson);
    }

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
                case JsonKnownTypes.pointStyle: return PointStyle;
                case JsonKnownTypes.lineStyle: return LineStyle;
                case JsonKnownTypes.fillStyle: return FillStyle;
                case JsonKnownTypes.iconStyle: return IconStyle;
                case JsonKnownTypes.textStyle: return TextStyle;
                case JsonKnownTypes.generalStyle: return GeneralStyle;
                case JsonKnownTypes.valueStyle: return ValueStyle;
                case JsonKnownTypes.classBreakStyle: return ClassBreakStyle;
                case 'image': return 'image';
                default: 
                    return undefined;
            }
        }
    }
}