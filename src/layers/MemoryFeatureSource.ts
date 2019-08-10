import { IEnvelope, Feature, Envelope, FeatureCollection, IFeature } from "ginkgoch-geom";
import { Field } from "./Field";
import { FeatureSource } from "./FeatureSource";

export class MemoryFeatureSource extends FeatureSource {
    _interFeatures: FeatureCollection;
    _interFields: Array<Field>;
    _maxFeatureId: number;

    constructor() {
        super();

        this._maxFeatureId = 0;
        this._interFeatures = new FeatureCollection();
        this._interFields = new Array<Field>();
    }

    /**
     * 
     * @param envelope 
     * @param fields 
     * @override
     */
    protected async _features(envelope: IEnvelope, fields: string[]): Promise<Feature[]> {
        const features = this._interFeatures.features.filter(f => {
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
    protected async _fields(): Promise<Field[]> {
        return this._interFields;
    }

    /**
     * @override
     */
    protected async _envelope(): Promise<Envelope> {
        return this._interFeatures.envelope();
    }

    /**
     * 
     * @param id 
     * @param fields 
     * @override
     */
    protected async _feature(id: number, fields: string[]): Promise<Feature | undefined> {
        let feature = this._interFeatures.features.find(f => f.id === id);
        if (feature === undefined) {
            return Promise.resolve(undefined);
        }

        return feature.clone(fields);
    }

    /**
     * @override
     */
    get editable() {
        return true;
    }

    /**
     * @override
     */
    get _openRequired() {
        return false;
    }

    protected async _push(feature: IFeature) {
        this._interFeatures.features.push(this._newFeature(feature));
    }

    protected async _update(feature: IFeature) {
        const sourceIndex = this._interFeatures.features.findIndex(f => f.id === feature.id);
        if (sourceIndex >= 0) {
            this._interFeatures.features.splice(sourceIndex, 1, this._newFeature(feature, true));
        }
    }

    protected async _remove(id: number) {
        const sourceIndex = this._interFeatures.features.findIndex(f => f.id === id);
        if (sourceIndex >= 0) {
            this._interFeatures.features.splice(sourceIndex, 1);
        }
    }

    protected async _pushField(field: Field) {
        this._interFields.push(field);
    }

    protected async _updateField(sourceFieldName: string, newField: Field) {
        const sourceIndex = this._interFields.findIndex(f => f.name === sourceFieldName);
        if (sourceIndex !== -1) {
            this._interFields.splice(sourceIndex, 1, newField);
        }
    }

    protected async _removeField(fieldName: string): Promise<void> {
        const sourceIndex = this._interFields.findIndex(f => f.name === fieldName);
        if (sourceIndex !== -1) {
            this._interFields.splice(sourceIndex, 1);
        }
    }

    private get _nextFeatureId() {
        this._maxFeatureId++;
        return this._maxFeatureId;
    }

    private _newFeature(feature: IFeature, persistId = false) {
        return new Feature(feature.geometry, feature.properties, persistId ? feature.id : this._nextFeatureId);
    }
}