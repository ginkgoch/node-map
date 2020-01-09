import { IEnvelope, Feature, Envelope, FeatureCollection, IFeature, GeometryFactory } from "ginkgoch-geom";
import { Field } from "./Field";
import { FeatureSource } from "./FeatureSource";
import { JSONUtils, JSONKnownTypes } from "../shared/JSONUtils";
import { Projection } from "./Projection";

/**
 * This class represents a feature source that maintains features in memory.
 * 
 * This feature source is used to store temporary features.
 * For instance, highlight, editing or adding feature buffer are all alow to store in this memory.
 * Remind to clear it to release the memory usage. 
 * Watch out the memory usage (if too many features are about to push into this source), 
 * please consider other feature source with persistent storage.
 */
export class MemoryFeatureSource extends FeatureSource {
    _interFeatures: FeatureCollection;
    _interFields: Array<Field>;
    _maxFeatureId: number;

    /**
     * Constructs an MemoryFeatureSource instance.
     * @param {IFeature[]} features The features to be pushed into this feature source. It is optional.
     * @param fields 
     * @param name 
     */
    constructor(features?: IFeature[], fields?: Field[], name?: string) {
        super();

        this.type = JSONKnownTypes.memoryFeatureSource;
        this.name = name || this.name;
        this._maxFeatureId = 0;
        this._interFeatures = new FeatureCollection(features);
        this._maxFeatureId = this._interFeatures.features.length;
        this._interFields = new Array<Field>();
        fields  && fields.forEach(f => this._interFields.push(f));
    }

    get internalFeatures(): Feature[] {
        return this._interFeatures.features;
    }

    /**
     * Converts this feature source into JSON data.
     */
    protected _toJSON(): any {
        const json = super._toJSON();
        json.type = JSONKnownTypes.memoryFeatureSource;
        json.features = this._interFeatures.toJSON();
        json.fields = JSONUtils.valueToJSON(this._interFields);
        return json;
    }

    /**
     * Parses the specified JSON format data as `MemoryFeatureSource`. 
     * Note: If the data doesn't match the schema, it throws exception.
     * @param {any} json The JSON format data that matches the `MemoryFeatureSource` schema.
     * @returns {MemoryFeatureSource} A memory feature source instance. 
     */
    static parseJSON(json: any) {
        const source = new MemoryFeatureSource();
        source.name = json.name;
        source.projection = Projection.parseJSON(json.projection);
        source._interFeatures = FeatureCollection.create(json.features);
        source._interFields = (<any[]>json.fields).map(j => Field.parseJSON(j));
        return source;
    }

    /**
     * Gets features by condition; if the condition is not set, all features will be fetched.
     * @param {IEnvelope} envelope The condition to filter out the features within the specified envelope. Optional with default value undefined.
     * @param {FieldFilters} fields The fields will come with the returned feature array. Optional with default value undefined.
     * @returns {Promise<Feature[]>} The feature array that matches the specified condition.
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
     * Gets all fields info in this feature source.
     * @returns {Promise<Field[]>} An array of fields info in this feature source.
     */
    protected async _fields(): Promise<Field[]> {
        return this._interFields;
    }

    /**
     * Gets the envelope (bounding box) of this feature source.
     * @returns {Promise<IEnvelope>} The envelope (bounding box) of this feature source.
     */
    protected async _envelope(): Promise<Envelope> {
        return this._interFeatures.envelope();
    }

    /**
     * Gets a feature instance by its id. If it doesn't exist, returns undefined.
     * @param {number} id The id of the feature to find.
     * @param {FieldFilters} fields The field filters that indicate the fields will be fetched with the returned feature instance.
     * @returns {Promise<Feature|undefined>} The feature that id equals to the specified id.
     */
    protected async _feature(id: number, fields: string[]): Promise<Feature | undefined> {
        let feature = this._interFeatures.features.find(f => f.id === id);
        if (feature === undefined) {
            return Promise.resolve(undefined);
        }

        return feature.clone(fields);
    }

    /**
     * Gets whether this feature source is editable (creating, updating and deleting).
     * @returns {boolean} This is feature source is always editable.
     */
    get editable() {
        return true;
    }

    /**
     * Indicates whether this feature source is necessary to manually open before doing CRUD operation.
     * @returns False means this feature source is allow to CRUD operation.
     */
    get _openRequired() {
        return false;
    }

    /**
     * Pushes a feature into this feature source.
     * @param {IFeature} feature The feature to push into this feature source. 
     * The difference to the public function is that, the feature parameter is converted to the same SRS of this feature source.
     */
    protected async _push(feature: IFeature) {
        this._interFeatures.features.push(this._newFeature(feature));
    }

    /**
     * Updates an existing feature in this feature source.
     * @param {IFeature} feature The feature to update in this feature source. 
     * The difference to the public function is that, the feature parameter is converted to the same SRS of this feature source.
     */
    protected async _update(feature: IFeature) {
        const sourceIndex = this._interFeatures.features.findIndex(f => f.id === feature.id);
        if (sourceIndex >= 0) {
            this._interFeatures.features.splice(sourceIndex, 1, this._newFeature(feature, true));
        }
    }

    /**
     * Removes a feature by a specified feature id.
     * @param {number} id The feature id to remove. 
     */
    protected async _remove(id: number) {
        const sourceIndex = this._interFeatures.features.findIndex(f => f.id === id);
        if (sourceIndex >= 0) {
            this._interFeatures.features.splice(sourceIndex, 1);
        }
    }

    /**
     * Pushes a new field into this feature source.
     * @param {Field} field A new field to push into this feature source. 
     */
    protected async _pushField(field: Field) {
        this._interFields.push(field);
    }

    /**
     * Updates an existing field info by field name.
     * @param {string} sourceFieldName The source field name to update.
     * @param {Field} newField A new field to replace to the old field.
     */
    protected async _updateField(sourceFieldName: string, newField: Field) {
        const sourceIndex = this._interFields.findIndex(f => f.name === sourceFieldName);
        if (sourceIndex !== -1) {
            this._interFields.splice(sourceIndex, 1, newField);
        }
    }

    /**
     * Removes a field by field name.
     * @param {string} fieldName A field name to remove. 
     */
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