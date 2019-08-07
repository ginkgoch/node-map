import { IEnvelope, Feature, Envelope, FeatureCollection } from "ginkgoch-geom";
import { Field } from "./Field";
import { FeatureSource } from "./FeatureSource";

export class MemoryFeatureSource extends FeatureSource {
    _memoryFeatures: FeatureCollection;
    _memoryFields: Array<Field>;

    constructor() {
        super();

        this._memoryFeatures = new FeatureCollection();
        this._memoryFields = new Array<Field>();
    }

    /**
     * 
     * @param envelope 
     * @param fields 
     * @override
     */
    protected async _features(envelope: IEnvelope, fields: string[]): Promise<Feature[]> {
        const features = this._memoryFeatures.features.filter(f => {
            return !Envelope.disjoined(envelope, f.geometry.envelope());
        }).map(f => {
            const props = new Map<string, any>();
            fields.forEach(field => {
                if (f.properties.has(field)) {
                    props.set(field, f.properties.get(field));
                }
            });
            return new Feature(f.geometry, props, f.id);
        });

        return Promise.resolve(features);
    }

    /**
     * @override
     */
    protected _fields(): Promise<Field[]> {
        return Promise.resolve(this._memoryFields);
    }

    /**
     * @override
     */
    protected async _envelope(): Promise<Envelope> {
        return await this._memoryFeatures.envelope();
    }

    /**
     * 
     * @param id 
     * @param fields 
     * @override
     */
    protected _feature(id: number, fields: string[]): Promise<Feature | undefined> {
        let feature = this._memoryFeatures.features.find(f => f.id === id);
        if (feature === undefined) {
            return Promise.resolve(undefined);
        }

        return Promise.resolve(feature.clone(fields));
    }

    /**
     * @override
     */
    get editable() {
        return true;
    }

    //TODO: CRUD and fields info.
}