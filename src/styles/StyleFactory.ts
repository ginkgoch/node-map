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
import { JSONKnownTypes, JSONTypeRegister, JSONUtils } from "../shared/JSONUtils";

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
            this.register.register(JSONKnownTypes.valueStyle, () => new ValueStyle());
            this.register.register(JSONKnownTypes.generalStyle, () => new GeneralStyle());
            this.register.register(JSONKnownTypes.classBreakStyle, () => new ClassBreakStyle());
        }
        return JSONUtils.jsonToObject(styleJson, this.register);
    }
}