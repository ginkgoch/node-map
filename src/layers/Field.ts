import { JsonUtils } from "../shared/JsonUtils";

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

    json() {
        return {
            name: this.name,
            type: this.type,
            length: this.length,
            extra: JsonUtils.mapToJson(this.extra)
        };
    }

    static parseJson(json: any) {
        const field = new Field();
        field.name = json.name;
        field.length = json.length;
        field.extra = JsonUtils.jsonToMap(json.extra);
        return field;
    }
}