import { JsonKnownTypes } from "../shared";
import { MemoryFeatureSource } from "./MemoryFeatureSource";
import { ShapefileFeatureSource } from "./ShapefileFeatureSource";

export class FeatureSourceFactory {
    static parseJson(json: any) {
        const type = json && json.type;
        if (type !== undefined) {
            return this._parseJson(json);
        }
        else return undefined;
    }

    private static _parseJson(json: any) {
        switch(json.type) {
            case JsonKnownTypes.memoryFeatureSource:
                return MemoryFeatureSource.parseJson(json);
            case JsonKnownTypes.shapefileFeatureSource:
                return ShapefileFeatureSource.parseJson(json);
            default:
                return undefined;
        }
    }
}