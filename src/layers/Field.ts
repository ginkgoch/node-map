import { JSONUtils } from "../shared/JSONUtils";

/**
 * This class maintains a field definition of a feature source.
 * It is a general field definition for almost all feature sources.
 * 
 * A field is formed with name, data type, length of a field to store corresponding value, 
 * and an extra hash map (key - value pairs) to store other infos that are not covered by pre-defined properties.
 */
export class Field {
    /**
     * @property
     * The name of the field.
     */
    name: string;
    /**
     * @property
     * The data type of the field.
     */
    type: string;
    /**
     * @property
     * The maximum data length of the field.
     */
    length: number;
    /**
     * @property
     * The extra info of the field.
     */
    extra: Map<string, any>;

    /**
     * Constructs a field instance.
     * @param {string} name Field name.
     * @param {string} type Field data type.
     * @param {number} length Field data length.
     * @param {any|Map} extra Field extra info. Optional, it can be either an object or Map.
     */
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

    /**
     * Converts current instance into JSON format.
     */
    toJSON() {
        return {
            name: this.name,
            type: this.type,
            length: this.length,
            extra: JSONUtils.mapToJSON(this.extra)
        };
    }

    /**
     * Parse JSON format data to a concrete instance.
     * @static 
     * @param {any} json JSON format data.
     * @returns {Field} A field instance that is converted from the JSON data.
     */
    static parseJSON(json: any): Field {
        const field = new Field();
        field.name = json.name;
        field.length = json.length;
        field.extra = JSONUtils.jsonToMap(json.extra);
        return field;
    }
}