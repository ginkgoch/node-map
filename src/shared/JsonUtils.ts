import _ from "lodash";

export class JsonUtils {
    static mapToJson(map: Map<string, any>): any {
        const json: any = {};
        map.forEach((v, k) => {
            json[k] = v;
        });
        
        return json;
    }
    
    static objectToJson(obj: any): any {
        let json = this._objectToJson(obj);
        return json;
    }

    private static _objectToJson(obj: any) {
        const json: any = {};
        _.forIn(obj, (v, k) => {
            if (typeof v !== 'function' && v !== undefined) {
                json[k] = this.valueToJson(v);
            }
        });

        return json;
    }

    static valueToJson(obj: any): any {
        if (obj.json !== undefined || typeof obj.json === 'function') {
            return obj.json();
        } else if (Array.isArray(obj)) {
            return obj.map(o => this.valueToJson(o));
        } else if (typeof obj === 'object') {
            return this._objectToJson(obj);
        } else {
            return obj;
        }
    }
}

export enum JsonKnownTypes {
    unknown = 'unknown',
    
    fillStyle = 'fill-style',
    iconStyle = 'icon-style',
    lineStyle = 'line-style',
    textStyle = 'text-style',
    pointStyle = 'point-style',
    valueStyle = 'value-style',
    generalStyle = 'general-style',
    classBreakStyle = 'class-break-style',

    memoryFeatureSource = 'memory-feature-source'
}