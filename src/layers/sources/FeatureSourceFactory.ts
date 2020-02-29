import { JSONKnownTypes } from "../../shared";
import { MemoryFeatureSource } from "./MemoryFeatureSource";
import { ShapefileFeatureSource } from "./ShapefileFeatureSource";

/**
 * This class is a shortcut to build FeatureSource instance.
 * @category source shared
 */
export class FeatureSourceFactory {
    /**
     * Parse supported feature source json data into a corresponding FeatureSource instance.
     * @param {any} json The JSON format data of a feature source.
     */
    static parseJSON(json: any) {
        const type = json && json.type;
        if (type !== undefined) {
            return this._parseJSON(json);
        }
        else return undefined;
    }

    private static _parseJSON(json: any) {
        switch(json.type) {
            case JSONKnownTypes.memoryFeatureSource:
                return MemoryFeatureSource.parseJSON(json);
            case JSONKnownTypes.shapefileFeatureSource:
                return ShapefileFeatureSource.parseJSON(json);
            default:
                return undefined;
        }
    }
}