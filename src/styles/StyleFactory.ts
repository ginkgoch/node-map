import _ from "lodash";
import { PointStyle } from ".";
import { LineStyle } from "./LineStyle";
import { Image } from '../render';
import { FillStyle } from "./FillStyle";
import { IconStyle } from "./IconStyle";
import { TextStyle } from "./TextStyle";
import { GeneralStyle } from "./GeneralStyle";
import { ValueStyle, ValueItem } from "./ValueStyle";
import { ClassBreakStyle, ClassBreakItem } from "./ClassBreakStyle";
import { JSONKnownTypes, JSONTypeRegister, JSONUtils } from "../shared/JSONUtils";

/** 
 * This class is a style factory to help to easily build style with JSON format data. 
 */
export class StyleFactory {
    static register: JSONTypeRegister;

    static parseJSON(styleJson: any) {
        if (this.register === undefined) {
            this.register = new JSONTypeRegister();
            this.register.register(JSONKnownTypes.image, json => new Image(Buffer.from(json.buffer.data)), true);
            this.register.register(JSONKnownTypes.fillStyle, () => new FillStyle());
            this.register.register(JSONKnownTypes.iconStyle, () => new IconStyle());
            this.register.register(JSONKnownTypes.lineStyle, () => new LineStyle());
            this.register.register(JSONKnownTypes.textStyle, () => new TextStyle());
            this.register.register(JSONKnownTypes.pointStyle, () => new PointStyle());
            this.register.register(JSONKnownTypes.generalStyle, () => new GeneralStyle());
            this.register.register(JSONKnownTypes.valueStyle, json => this.parseValueStyle(json), true);
            this.register.register(JSONKnownTypes.classBreakStyle, json => this.parseClassBreakStyle(json), true);
        }
        return JSONUtils.jsonToObject(styleJson, this.register);
    }

    private static parseClassBreakStyle(json: any) {
        const style = new ClassBreakStyle();
        _.forIn(json, (v, k) => {
            if (k === 'classBreaks') {
                const items = (<Array<any>>v).map(item => {
                    const newItem: ClassBreakItem = { minimum: item.minimum, maximum: item.maximum, style: JSONUtils.jsonToObject(item.style, this.register) };
                    return newItem;
                });
                style.classBreaks.push(...items);
            }
            else {
                (<any>style)[k] = JSONUtils.jsonToObject(v, this.register);
            }
        });

        return style;
    }

    private static parseValueStyle(json: any) {
        const style = new ValueStyle();
        _.forIn(json, (v, k) => {
            if (k === 'items') {
                const items = (<Array<any>>v).map(item => {
                    const newItem: ValueItem = { value: item.value, style: JSONUtils.jsonToObject(item.style, this.register) };
                    return newItem;
                });
                style.items.push(...items);
            }
            else {
                (<any>style)[k] = JSONUtils.jsonToObject(v, this.register);
            }
        });

        return style;
    }
}