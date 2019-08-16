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

    static jsonToObject(json: any, register: JsonTypeRegister): any {
        return this._jsonToObject(json, register);
    }

    private static _jsonToObject(json: any, register: JsonTypeRegister): any {
        if (Array.isArray(json)) {
            return json.map(j => this._jsonToObject(j, register));
        } else if (json === null || json === undefined) {
            return json;
        } else if (json.type !== undefined) {
            const creator = register.get(json['type']);
            if (creator !== undefined) {
                const obj = creator.create(json);
                if (!creator.ignoreChildren) {
                    _.forIn(json, (v, k) => {
                        obj[k] = this._jsonToObject(v, register);
                    });
                }

                return obj;
            }
            return undefined;
        } else {
            return json;
        }
    }
}

export enum JsonKnownTypes {
    unknown = 'unknown',

    image = 'image',
    fillStyle = 'fill-style',
    iconStyle = 'icon-style',
    lineStyle = 'line-style',
    textStyle = 'text-style',
    pointStyle = 'point-style',
    valueStyle = 'value-style',
    generalStyle = 'general-style',
    classBreakStyle = 'class-break-style',

    memoryFeatureSource = 'memory-feature-source',
    shapefileFeatureSource = 'shapefile-feature-source',

    featureLayer = 'feature-layer',
    layerGroup = 'layer-group',
}

export interface JsonObjectCreator {
    create: (...args: any[]) => any,
    ignoreChildren: boolean
}

export class JsonTypeRegister {
    registers: Map<string, JsonObjectCreator> = new Map<string, JsonObjectCreator>();

    register(name: string, creator: (...args: any[]) => any, ignoreChildren = false): JsonTypeRegister {
        this.registers.set(name, {
            create: creator,
            ignoreChildren: ignoreChildren
        });
        return this;
    }

    get(name: string) {
        return this.registers.get(name);
    }
}