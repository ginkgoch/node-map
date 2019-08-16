import { JSONUtils } from "../shared/JSONUtils";

export class Field {
    name: string;
    type: string;
    length: number;
    extra: Map<string, any>;

    constructor(name?: string, type?: string, length: number = 10, extra?: any) {
        this.name = name || '';
        this.type = type || '';
        this.length = length || 0;
        this.extra = new Map();

        if (extra instanceof Map) {
            extra.forEach((v, k) => {
                this.extra.set(k, v);
            });
        } else if (extra !== undefined) {
            Object.keys(extra).forEach(k => {
                this.extra.set(k, extra[k]);
            });
        }
    }

    toJSON() {
        return {
            name: this.name,
            type: this.type,
            length: this.length,
            extra: JSONUtils.mapToJSON(this.extra)
        };
    }

    static parseJSON(json: any) {
        const field = new Field();
        field.name = json.name;
        field.length = json.length;
        field.extra = JSONUtils.jsonToMap(json.extra);
        return field;
    }
}