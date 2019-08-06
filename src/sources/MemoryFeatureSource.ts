import { FeatureSource } from "./FeatureSource";
import { IEnvelope, Feature, Envelope } from "ginkgoch-geom";
import { Field } from "./Field";

export class MemoryFeatureSource extends FeatureSource {
    _memoryFeatures: Array<Feature>;

    constructor() {
        super();

        this._memoryFeatures = new Array<Feature>();
    }

    protected _features(envelope?: IEnvelope): Promise<Feature[]> {
        throw new Error("Method not implemented.");
    }

    protected _fields(): Promise<Field[]> {
        throw new Error("Method not implemented.");
    }

    protected _envelope(srs?: string): Promise<Envelope> {
        throw new Error("Method not implemented.");
    }

    protected _feature(id: string, fields?: "all" | "none" | string[]): Promise<Feature> {
        throw new Error("Method not implemented.");
    }

    protected _open(): Promise<void> { 
        return Promise.resolve();
    }

    protected _close(): Promise<void> {
        return Promise.resolve();
    }

    editable() {
        return true;
    }
}