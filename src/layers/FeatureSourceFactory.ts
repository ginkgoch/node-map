import { JsonKnownTypes } from "../shared";
import { MemoryFeatureSource } from "./MemoryFeatureSource";
import { ShapefileFeatureSource } from "./ShapefileFeatureSource";

export class FeatureSourceFactory {
    static parseJSON(json: any) {
        const type = json && json.type;
        if (type !== undefined) {
            return this._parseJson(json);
        }
        else return undefined;
    }

    private static _parseJson(json: any) {
        switch(json.type) {
            case JsonKnownTypes.memoryFeatureSource:
                return MemoryFeatureSource.parseJSON(json);
            case JsonKnownTypes.shapefileFeatureSource:
                return ShapefileFeatureSource.parseJSON(json);
            default:
                return undefined;
        }
    }
}