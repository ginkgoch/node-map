import { JSONKnownTypes } from "../shared";
import { MemoryFeatureSource } from "./MemoryFeatureSource";
import { ShapefileFeatureSource } from "./ShapefileFeatureSource";

export class FeatureSourceFactory {
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