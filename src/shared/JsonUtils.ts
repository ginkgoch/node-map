import _ from "lodash";

export class JSONUtils {
    static mapToJSON(map: Map<string, any>): any {
        const json: any = {};
        map.forEach((v, k) => {
            json[k] = v;
        });

        return json;
    }

    static jsonToMap(json: any): Map<string, any> {
        const map = new Map<string, any> ();
        _.forIn(json, (v, k) => {
            map.set(k, v);
        });

        return map;
    }

    static objectToJSON(obj: any): any {
        let json = this._objectToJSON(obj);
        return json;
    }

    private static _objectToJSON(obj: any) {
        const json: any = {};
        _.forIn(obj, (v, k) => {
            if (typeof v !== 'function' && v !== undefined) {
                json[k] = this.valueToJSON(v);
            }
        });

        return json;
    }

    static valueToJSON(obj: any): any {
        if (obj.toJSON !== undefined && typeof obj.toJSON === 'function') {
            return obj.toJSON();
        } else if (Array.isArray(obj)) {
            return obj.map(o => this.valueToJSON(o));
        } else if (typeof obj === 'object') {
            return this._objectToJSON(obj);
        } else {
            return obj;
        }
    }

    static jsonToObject(json: any, register: JSONTypeRegister): any {
        return this._jsonToObject(json, register);
    }

    private static _jsonToObject(json: any, register: JSONTypeRegister): any {
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

export enum JSONKnownTypes {
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
    geoJSONFeatureSource = 'geo-json-feature-source',
    csvFeatureSource = 'csv-feature-source',

    featureLayer = 'feature-layer',
    layerGroup = 'layer-group',
}

export interface JSONObjectCreator {
    create: (...args: any[]) => any,
    ignoreChildren: boolean
}

export class JSONTypeRegister {
    registers: Map<string, JSONObjectCreator> = new Map<string, JSONObjectCreator>();

    register(name: string, creator: (...args: any[]) => any, ignoreChildren = false): JSONTypeRegister {
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