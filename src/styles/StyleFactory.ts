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
import { JsonKnownTypes, JsonTypeRegister, JsonUtils } from "../shared/JsonUtils";

export class StyleFactory {
    static register: JsonTypeRegister;

    static parseJson(styleJson: any) {
        if (this.register === undefined) {
            this.register = new JsonTypeRegister();
            this.register.register(JsonKnownTypes.image, json => new Image(Buffer.from(json.buffer.data)), true);
            this.register.register(JsonKnownTypes.fillStyle, () => new FillStyle());
            this.register.register(JsonKnownTypes.iconStyle, () => new IconStyle());
            this.register.register(JsonKnownTypes.lineStyle, () => new LineStyle());
            this.register.register(JsonKnownTypes.textStyle, () => new TextStyle());
            this.register.register(JsonKnownTypes.pointStyle, () => new PointStyle());
            this.register.register(JsonKnownTypes.valueStyle, () => new ValueStyle());
            this.register.register(JsonKnownTypes.generalStyle, () => new GeneralStyle());
            this.register.register(JsonKnownTypes.classBreakStyle, () => new ClassBreakStyle());
        }
        return JsonUtils.jsonToObject(styleJson, this.register);
    }
}