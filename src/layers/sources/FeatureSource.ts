import _ from "lodash";
import { IEnvelope, Feature, IFeature, Envelope } from "ginkgoch-geom";
import { Opener, Validator, JSONKnownTypes } from "../../shared";
import { Field, PropertyAggregator, Projection } from "..";
import { BaseIndex } from "../../indices";

/**
 * This is a new type that could be replaced with 'all', 'none' or a string array.
 */
export type FieldFilters = 'all' | 'none' | string[];

/**
 * This class represents a base class of all feature source.
 * It provides the portal for developers to CRUD features from the the database.
 * 
 * A feature source stands for a feature based database. 
 * For instance, ShapeFile is a popular feature based database.
 * 
 * @see {@link ShapefileFeatureSource} for reading Shapefile data format.
 */
export abstract class FeatureSource extends Opener {
    /**
     * The name of feature source.
     */
    name: string;
    /**
     * The projection of feature source.
     */
    projection: Projection
    /**
     * The feature geometry type.
     */
    type = JSONKnownTypes.unknown;
    /**
     * Enable or disable the spatial index if it is being set. 
     * It works when this property is set to `true` and the index property is set properly.
     * 
     * The default value is true.
     */
    indexEnabled = true;
    /**
     * The spatial index instance that is used to speed up the query performance. 
     * It is optional property.
     */
    index?: BaseIndex;

    /**
     * This is the constructor of feature source.
     * 
     * It sets the default name as `Unknown` 
     * and initialize an undefined from and to projection instance.
     */
    constructor() {
        super();

        this.name = 'Unknown';
        this.projection = new Projection();
    }

    /**
     * Opens this feature source. Prepares its necessary resource and get ready for CRUD.
     */
    protected _open(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Closes this feature source and release the resources. 
     * Once it is closed, any CRUD resource related operation will throw an exception.
     */
    protected _close(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Gets features by condition; if the condition is not set, all features will be fetched.
     * @param {IEnvelope} envelope The condition to filter out the features within the specified envelope. Optional with default value undefined.
     * @param {FieldFilters} fields The fields will come with the returned feature array. Optional with default value undefined.
     * @returns {Promise<Feature[]>} The feature array that matches the specified condition.
     */
    async features(envelope?: IEnvelope, fields?: FieldFilters): Promise<Feature[]> {
        Validator.checkOpened(this, !this._openRequired);

        let envelopeIn = envelope;
        if (envelopeIn !== undefined) {
            envelopeIn = this._inverseProjection(envelopeIn);
        } else {
            envelopeIn = { minx: Number.NEGATIVE_INFINITY, miny: Number.NEGATIVE_INFINITY, maxx: Number.POSITIVE_INFINITY, maxy: Number.POSITIVE_INFINITY };
        }

        const fieldsNorm = await this._normalizeFields(fields);
        const featuresIn = await this._features(envelopeIn, fieldsNorm);
        const featuresOut = this._forwardProjection(featuresIn);
        return featuresOut;
    }

    /**
     * Gets features by condition; if the condition is not set, all features will be fetched.
     * @param {IEnvelope} envelope The condition to filter out the features within the specified envelope. Optional with default value undefined.
     * @param {FieldFilters} fields The fields will come with the returned feature array. Optional with default value undefined.
     * @returns {Promise<Feature[]>} The feature array that matches the specified condition.
     *  
     */
    protected abstract async _features(envelope: IEnvelope, fields: string[]): Promise<Feature[]>;

    /**
     * Gets a feature instance by its id. If it doesn't exist, returns undefined.
     * @param {number} id The id of the feature to find.
     * @param {FieldFilters} fields The field filters that indicate the fields will be fetched with the returned feature instance.
     * @returns {Promise<Feature|undefined>} The feature that id equals to the specified id.
     */
    async feature(id: number, fields?: FieldFilters): Promise<Feature | undefined> {
        let fieldsNorm = await this._normalizeFields(fields);
        let feature = await this._feature(id, fieldsNorm);
        if (feature === undefined) {
            return undefined;
        }

        feature = this._forwardProjection(feature);
        return feature;
    }

    /**
     * Gets a feature instance by its id. If it doesn't exist, returns undefined.
     * @param {number} id The id of the feature to find.
     * @param {FieldFilters} fields The field filters that indicate the fields will be fetched with the returned feature instance.
     * @returns {Promise<Feature|undefined>} The feature that id equals to the specified id.
     *  
     */
    protected abstract async _feature(id: number, fields: string[]): Promise<Feature | undefined>;

    /**
     * Normalizes field filters to concrete field name array.
     * @param {FieldFilters} fields The field filter.
     * @returns An array of filed names.
     *  
     */
    protected async _normalizeFields(fields?: FieldFilters): Promise<string[]> {
        if (fields === 'none') return [];

        const allFields = (await this.fields()).map(f => f.name);
        if (fields === 'all' || fields === undefined) {
            return allFields;
        } else {
            return _.intersection(allFields, fields);
        }
    }

    /**
     * Gets the features count.
     * @returns The feature count.
     */
    async count(): Promise<number> {
        Validator.checkOpened(this, !this._openRequired);
        const count = await this._count();
        return count;
    }

    /**
     * Gets the features count. 
     * Developer Remark: The default implementation loads all features and then count. 
     * It is a general implementation but bad performance. When creating a new feature source, 
     * consider to override this function with a corresponding implementation to get the count.
     * @returns The feature count.
     *  
     */
    protected async _count(): Promise<number> {
        return (await this.features()).length;
    }

    /**
     * Gets all fields info in this feature source.
     * @returns {Promise<Field[]>} An array of fields info in this feature source.
     */
    async fields() {
        Validator.checkOpened(this, !this._openRequired);

        return await this._fields();
    }

    /**
     * Gets all fields info in this feature source.
     * @returns {Promise<Field[]>} An array of fields info in this feature source.
     */
    protected abstract async _fields(): Promise<Field[]>;

    /**
     * This is an aggregator utility based on the properties. 
     * It provides to find min, max, average, distinct etc. values based on the feature source properties.
     * 
     * Use case: 
     * 
     * @param {FieldFilters} fields The fields that will be included for aggregation.
     * @returns {PropertyAggregator} A PropertyAggregator instance.
     */
    async propertyAggregator(fields?: FieldFilters) {
        const properties = await this.properties(fields);
        return new PropertyAggregator(properties);
    }

    /**
     * This methods fetches properties from all features in this feature source.
     * @param fields The fields filter.
     * @returns {Promise<Array<Map<string, any>>>} An array of properties from all features in this feature source.
     */
    async properties(fields?: FieldFilters): Promise<Array<Map<string, any>>> {
        Validator.checkOpened(this, !this._openRequired);

        const f = await this._normalizeFields(fields);
        return await this._properties(f);
    }

    /**
     * This methods fetches properties from all features in this feature source.
     * @param fields The fields filter.
     * @returns {Promise<Array<Map<string, any>>>} An array of properties from all features in this feature source.
     */
    protected async _properties(fields: string[]): Promise<Array<Map<string, any>>> {
        const features = await this.features(undefined, fields);
        const properties = new Array<Map<string, any>>();
        features.forEach(f => {
            properties.push(_.clone(f.properties));
        })

        return properties;
    }

    /**
     * Gets the envelope (bounding box) of this feature source.
     * @returns {Promise<IEnvelope>} The envelope (bounding box) of this feature source.
     */
    async envelope() {
        Validator.checkOpened(this, !this._openRequired);

        let envelope = await this._envelope();
        return this.projection.forward(envelope);
    }

    /**
     * Gets the envelope (bounding box) of this feature source.
     * @returns {Promise<IEnvelope>} The envelope (bounding box) of this feature source.
     */
    protected abstract async _envelope(): Promise<Envelope>;

    /**
     * A shortcut of getting source SRS (spatial reference system) from the projection property.
     * @returns {string|undefined} Either the concrete SRS or undefined if it is not set nor detected.
     */
    get srs(): string | undefined {
        return this.projection.from.projection;
    }

    /**
     * A shortcut of setting source SRS (spatial reference system) from the projection property.
     */
    set srs(srs: string | undefined) {
        this.projection.from.projection = srs;
    }

    /**
     * Converts a feature or envelope from target SRS to source SRS.
     * @param {IEnvelope|IFeature} param The envelope or feature to be converted.
     * @returns {IEnvelope|IFeature} The envelope or feature in source SRS.
     * 
     */
    protected _inverseProjection(envelope: IEnvelope): IEnvelope;
    protected _inverseProjection(feature: IFeature): Feature;
    protected _inverseProjection(param: IEnvelope | IFeature): IEnvelope | Feature {
        if (this.isEnvelope(param)) {
            let envelope = param as IEnvelope;
            envelope = this.projection.inverse(envelope);
            return envelope;
        } else {
            let f = param as IFeature;
            let geometry = f.geometry.clone(c => this.projection.inverse(c));
            return new Feature(geometry, f.properties, f.id);
        }
    }

    /**
     * Converts a feature or envelope from source SRS to target SRS.
     * @param {IEnvelope|IFeature} param The envelope or feature to be converted.
     * @returns {IEnvelope|IFeature} The envelope or feature in target SRS.
     * 
     */
    protected _forwardProjection(feature: IFeature): Feature
    protected _forwardProjection(features: IFeature[]): Feature[]
    protected _forwardProjection(param: IFeature | IFeature[]): Feature | Feature[] {
        if (Array.isArray(param)) {
            let features = param as IFeature[];
            return features.map(f => {
                let geom = f.geometry.clone(c => this.projection.forward(c));
                return new Feature(geom, f.properties, f.id);
            });
        } else {
            let f = param as IFeature;
            let geom = f.geometry.clone(c => this.projection.inverse(c));
            return new Feature(geom, f.properties, f.id);
        }
    }

    //#region edit

    /**
     * Gets whether this feature source is editable (creating, updating and deleting).
     * @returns {boolean} Whether this feature source is editable.
     */
    get editable() {
        return false;
    }

    /**
     * Pushes a feature into this feature source.
     * @param {IFeature} feature The feature to push into this feature source. 
     * If this feature source's source and target SRS are defined, this feature must be the same SRS as the target SRS of this feature source.
     */
    async push(feature: IFeature) {
        Validator.checkOpenAndEditable(this, !this._openRequired);

        const featureIn = this._inverseProjection(feature);
        this._push(featureIn);
    }

    /**
     * Pushes a feature into this feature source.
     * @param {IFeature} feature The feature to push into this feature source. 
     * The difference to the public function is that, the feature parameter is converted to the same SRS of this feature source.
     * 
     */
    protected async _push(feature: IFeature) {
        this._notImplemented();
    }

    /**
     * Updates an existing feature in this feature source. 
     * @param {IFeature} feature The feature to update in this feature source. 
     * If this feature source's source and target SRS are defined, this feature must be the same SRS as the target SRS of this feature source.
     */
    async update(feature: IFeature) {
        Validator.checkOpenAndEditable(this, !this._openRequired);

        const featureIn = this._inverseProjection(feature);
        await this._update(featureIn);
    }

    /**
     * Updates an existing feature in this feature source.
     * @param {IFeature} feature The feature to update in this feature source. 
     * The difference to the public function is that, the feature parameter is converted to the same SRS of this feature source.
     * 
     */
    protected async _update(feature: IFeature) {
        this._notImplemented();
    }

    /**
     * Removes a feature by a specified feature id.
     * @param {number} id The feature id to remove. 
     */
    async remove(id: number) {
        Validator.checkOpenAndEditable(this, !this._openRequired);

        await this._remove(id);
    }

    /**
     * Removes a feature by a specified feature id.
     * @param {number} id The feature id to remove. 
     * 
     */
    protected async _remove(id: number) {
        this._notImplemented();
    }

    /**
     * Pushes a new field into this feature source.
     * @param {Field} field A new field to push into this feature source. 
     */
    async pushField(field: Field) {
        Validator.checkOpenAndEditable(this, !this._openRequired);

        await this._pushField(field);
    }

    /**
     * Pushes a new field into this feature source.
     * @param {Field} field A new field to push into this feature source. 
     * 
     */
    protected async _pushField(field: Field): Promise<void> {
        this._notImplemented();
    }

    /**
     * Updates an existing field info by field name.
     * @param {string} sourceFieldName The source field name to update.
     * @param {Field} newField A new field to replace to the old field.
     */
    async updateField(sourceFieldName: string, newField: Field) {
        Validator.checkOpenAndEditable(this, !this._openRequired);

        await this._updateField(sourceFieldName, newField);
    }

    /**
     * Updates an existing field info by field name.
     * @param {string} sourceFieldName The source field name to update.
     * @param {Field} newField A new field to replace to the old field.
     * 
     */
    protected async _updateField(sourceFieldName: string, newField: Field): Promise<void> {
        this._notImplemented();
    }

    /**
     * Removes a field by field name.
     * @param {string} fieldName A field name to remove. 
     */
    async removeField(fieldName: string) {
        Validator.checkOpenAndEditable(this, !this._openRequired);

        await this._removeField(fieldName);
    }

    /**
     * Removes a field by field name.
     * @param {string} fieldName A field name to remove. 
     * 
     */
    protected async _removeField(fieldName: string): Promise<void> {
        this._notImplemented();
    }

    /**
     * Flush the field changes into this feature source storage.
     */
    async flushFields() {
        Validator.checkOpenAndEditable(this, !this._openRequired);

        await this._flushFields();
    }

    /**
     * Flush the field changes into this feature source storage.
     * 
     */
    protected async _flushFields() { }

    private _notImplemented() {
        throw new Error('Not implemented');
    }
    //#endregion

    //#region toJson

    /**
     * Converts this feature source into JSON data.
     */
    toJSON(): any {
        return this._toJSON();
    }

    /**
     * Converts this feature source into JSON data.
     * 
     */
    protected _toJSON(): any {
        return {
            type: this.type,
            name: this.name,
            projection: this.projection.toJSON()
        };
    }

    //#endregion

    private isEnvelope(obj: any) {
        return ['minx', 'miny', 'maxx', 'maxy'].every(v => v in obj)
    }
}