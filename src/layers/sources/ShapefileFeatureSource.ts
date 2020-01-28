import fs from "fs";
import path from 'path';
import _ from "lodash";
import { Shapefile, DbfField, DbfFieldType, ShapefileType } from "ginkgoch-shapefile";
import { IEnvelope, Feature, Envelope, IFeature } from "ginkgoch-geom";
import { FeatureSource, Field } from "..";
import { Validator, JSONKnownTypes } from '../../shared';
import { Projection, Srs } from "../Projection";
import { RTIndex, RTRecordType } from "../../indices";

const DBF_FIELD_DECIMAL = 'decimal';

/**
 * This class represents a feature source that CRUD records from shapefile.
 */
export class ShapefileFeatureSource extends FeatureSource {
    /**
     * The file system flags to open the shapefile.
     * @see {@link https://nodejs.org/api/fs.html#fs_file_system_flags} for options.
     */
    flag: string;
    private _filePath: string;
    private _shapefile?: Shapefile;

    /**
     * Constructs a shapefile feature source instance.
     * @param {string} filePath The shape file path name. 
     * @param {string} flag The file system flags to open the shapefile.
     * @param {string} name The name of this feature source.
     */
    constructor(filePath?: string, flag: string = 'rs', name?: string) {
        super();

        this.type = JSONKnownTypes.shapefileFeatureSource;
        this._filePath = filePath || '';

        if (name !== undefined) {
            this.name = name;
        } else if (filePath != undefined) {
            this.name = ShapefileFeatureSource._filename(filePath);
        }
        this.flag = flag;
    }

    /**
     * filePath Gets the path file name of the shapefile.
     */
    public get filePath() {
        return this._filePath;
    }

    /**
     * Sets the path file name of the shapefile.
     */
    public set filePath(filePath: string) {
        this._filePath = filePath;
        if (this.name === '' || this.name.match(/^unknown/i)) {
            this.name = ShapefileFeatureSource._filename(filePath);
        }
    }

    /**
     * Gets the shapefile type.
     */
    public get shapeType(): ShapefileType {
        Validator.checkOpened(this);
        return this.__shapefile.shapeType();
    }

    /**
     * Converts this feature source into JSON data.
     * 
     */
    protected _toJSON() {
        const json = super._toJSON();
        json.flag = this.flag;
        json.filePath = this.filePath;
        return json;
    }

    /**
     * Parses the JSON data into a shapefile source instance.
     * @param {any} json The JSON data to convert.
     * @returns {ShapefileFeatureSource} The shapefile source instance that is converted from the JSON data.
     */
    static parseJSON(json: any) {
        const source = new ShapefileFeatureSource();
        source.name = _.defaultTo(json.name, 'Unknown');
        source.flag = _.defaultTo(json.flag, 'rs');
        source.filePath = _.defaultTo(json.filePath, '');
        source.projection = Projection.parseJSON(json.projection);
        return source;
    }

    /**
     * Gets whether this feature source is editable (creating, updating and deleting).
     * @returns {boolean} This is feature source is always editable.
     */
    get editable() {
        return true;
    }

    /**
     * Builds index for this shapefile source.
     * @param {boolean} overwrite True means overwrite if the target index file exists; 
     * otherwise, skip building index if exists. Default value is false.
     */
    buildIndex(overwrite = false) {
        const indexFilePath = RTIndex.entry(this.filePath);
        const indexFileExists = RTIndex.exists(indexFilePath);
        if (!overwrite && indexFileExists) {
            return;
        }

        const recordType = this.__shapefile.shapeType() === ShapefileType.point ? RTRecordType.point : RTRecordType.rectangle;
        const recordCount = this.__shapefile.count();
        const pageSize = RTIndex.recommendPageSize(recordCount);
        const tempIndexFilePath = RTIndex.temp(indexFilePath);

        RTIndex.clean(tempIndexFilePath);
        RTIndex.create(tempIndexFilePath, recordType, { overwrite, pageSize });
        const index = new RTIndex(tempIndexFilePath, 'rs+');
        index.open();

        const iterator = this.__shapefile.iterator();
        while(!iterator.done) {
            const record = iterator.next();
            if (record.hasValue && record.value !== null) {
                const feature = record.value!;
                index.push(feature.geometry, feature.id.toString());
            }
        }
        index.close();
        RTIndex.move(tempIndexFilePath, indexFilePath, overwrite);
    }

    /**
     * Opens this feature source.
     * 
     * This operation does following tasks.
     * 1. Opens the shapefile resource.
     * 2. Load the projection file as internal SRS.
     * 3. If index enabled and index file exists, load index file.
     */
    protected async _open() {
        Validator.checkFilePathNotEmptyAndExist(this.filePath);

        this._shapefile = new Shapefile(this.filePath, this.flag);
        this._shapefile.open();

        const projFilePath = this.filePath.replace(/\.shp/i, '.prj');
        if (this.projection.from.projection === undefined && fs.existsSync(projFilePath)) {
            const projWKT = fs.readFileSync(projFilePath).toString('utf-8').trim().replace(/\u0000$/i, '');
            this.projection.from = new Srs(projWKT);
        }

        if (this.indexEnabled) {
            if (this.index === undefined && RTIndex.exists(this.filePath)) {
                const idxFilePath = RTIndex.entry(this.filePath);
                this.index = new RTIndex(idxFilePath, this.flag);
            }

            if (this.index !== undefined) {
                this.index.open();
            }
        }
    }

    /**
     * Closes this feature source and release the resources. 
     * Once it is closed, any CRUD resource related operation will throw an exception.
     */
    protected async _close() {
        if (this._shapefile) {
            this._shapefile.close();
            this._shapefile = undefined;
        }

        if (this.index) {
            this.index.close();
            this.index = undefined;
        }
    }

    /**
     * Gets the features count. 
     * @returns The feature count.
     *  
     */
    protected async _count(): Promise<number> {
        return this.__shapefile.count();
    }

    /**
     * Gets features by condition; if the condition is not set, all features will be fetched.
     * @param {IEnvelope} envelope The condition to filter out the features within the specified envelope. Optional with default value undefined.
     * @param {FieldFilters} fields The fields will come with the returned feature array. Optional with default value undefined.
     * @returns {Promise<Feature[]>} The feature array that matches the specified condition.
     */
    protected async _features(envelope: IEnvelope, fields: string[]): Promise<Feature[]> {
        let features: Array<Feature>;
        if (this.indexEnabled && this.index !== undefined) {
            const ids = this.index.intersections(envelope);
            features = new Array<Feature>();
            for(let id of ids) {
                const feature = this.__shapefile.get(parseInt(id), fields);
                if (feature !== null) {
                    features.push(feature);
                }
            }
        }
        else {
            features = this.__shapefile.records({ envelope, fields });
        }

        return Promise.resolve(features);
    }

    /**
     * Gets all fields info in this feature source.
     * @returns {Promise<Field[]>} An array of fields info in this feature source.
     *  
     */
    protected async _fields(): Promise<Field[]> {
        const fields = this.__shapefile.fields(true) as DbfField[];
        return fields.map(f => ShapefileFeatureSource._mapDbfFieldToField(f));
    }

    /**
     * Gets the envelope (bounding box) of this feature source.
     * @returns {Promise<IEnvelope>} The envelope (bounding box) of this feature source.
     */
    protected async _envelope(): Promise<Envelope> {
        return this.__shapefile.envelope();
    }

    /**
     * Gets a feature instance by its id. If it doesn't exist, returns undefined.
     * @param {number} id The id of the feature to find.
     * @param {FieldFilters} fields The field filters that indicate the fields will be fetched with the returned feature instance.
     * @returns {Promise<Feature|undefined>} The feature that id equals to the specified id.
     */
    protected async _feature(id: number, fields: string[]): Promise<Feature | undefined> {
        const feature = this.__shapefile.get(id, fields);
        return feature === null ? undefined : feature;
    }

    /**
     * This methods fetches properties from all features in this feature source.
     * @param fields The fields filter.
     * @returns {Promise<Array<Map<string, any>>>} An array of properties from all features in this feature source.
     */
    protected async _properties(fields: string[]): Promise<Array<Map<string, any>>> {
        return this.__shapefile._dbf.value.records({ fields })
            .filter(r => !r.deleted)
            .map(r => _.clone(r.values));
    }

    static createEmpty(filePath: string, fileType: ShapefileType, fields: Field[]): ShapefileFeatureSource {
        const dbfFields = fields.map(ShapefileFeatureSource._mapFieldToDbfField);
        const shapefile = Shapefile.createEmpty(filePath, fileType, dbfFields);
        shapefile.close();

        const newSource = new ShapefileFeatureSource(filePath, 'rs+');
        return newSource;
    }

    public async copySchemaAs(targetFilePath: string): Promise<ShapefileFeatureSource> {
        const openStatus = this.opened;

        if (!openStatus) {
            await this.open();
        }

        const fileType = this.shapeType;
        const fields = await this.fields();
        if (!openStatus) {
            await this.close();
        }

        const newSource = ShapefileFeatureSource.createEmpty(targetFilePath, fileType, fields);
        return newSource;
    }

    /**
     * Pushes a feature into this feature source.
     * @param {IFeature} feature The feature to push into this feature source. 
     * The difference to the public function is that, the feature parameter is converted to the same SRS of this feature source.
     * 
     */
    protected async _push(feature: IFeature) {
        this.__shapefile.push(feature);
    }

    /**
     * Updates an existing feature in this feature source.
     * @param {IFeature} feature The feature to update in this feature source. 
     * The difference to the public function is that, the feature parameter is converted to the same SRS of this feature source.
     */
    protected async _update(feature: IFeature) {
        this.__shapefile.update(feature);
    }

    /**
     * Removes a feature by a specified feature id.
     * @param {number} id The feature id to remove. 
     */
    protected async _remove(id: number) {
        this.__shapefile.remove(id);
    }

    /**
     * Pushes a new field into this feature source.
     * @param {Field|DbfField} field A new field to push into this feature source. 
     */
    protected async _pushField(field: DbfField): Promise<void>
    protected async _pushField(field: Field): Promise<void>
    protected async _pushField(field: Field | DbfField): Promise<void> {
        let dbfField = ShapefileFeatureSource._toDbfField(field);
        this.__shapefile.pushField(dbfField);
    }

    /**
     * Updates an existing field info by field name.
     * @param {string} sourceFieldName The source field name to update.
     * @param {Field|DbfField} newField A new field to replace to the old field.
     */
    protected async _updateField(sourceFieldName: string, newField: Field): Promise<void>
    protected async _updateField(sourceFieldName: string, newField: DbfField): Promise<void>
    protected async _updateField(sourceFieldName: string, newField: Field | DbfField): Promise<void> {
        let dbfField = ShapefileFeatureSource._toDbfField(newField);
        this.__shapefile.updateField(sourceFieldName, dbfField);
    }

    /**
     * Removes a field by field name.
     * @param {string} fieldName A field name to remove. 
     */
    protected async _removeField(fieldName: string): Promise<void> {
        this.__shapefile.removeField(fieldName);
    }

    /**
     * Flush the field changes into this feature source storage.
     */
    protected async _flushFields() {
        this.__shapefile.flushFields();
    }

    private get __shapefile() {
        return this._shapefile as Shapefile;
    }

    private static _mapDbfFieldToField(dbfField: DbfField) {
        const fieldType = ShapefileFeatureSource._mapDbfFieldTypeToName(dbfField.type);
        const field = new Field(dbfField.name, fieldType, dbfField.length);
        field.extra.set(DBF_FIELD_DECIMAL, dbfField.decimal);
        return field;
    }

    private static _mapFieldToDbfField(field: Field) {
        const fieldType = ShapefileFeatureSource._mapNameToDbfFieldType(field.type);
        const dbfField = new DbfField(field.name, fieldType, field.length);
        if (field.extra.has(DBF_FIELD_DECIMAL)) {
            dbfField.decimal = field.extra.get(DBF_FIELD_DECIMAL);
        }

        return dbfField;
    }

    private static _mapDbfFieldTypeToName(fieldType: DbfFieldType) {
        const enumType = DbfFieldType as any;
        for (let key in enumType) {
            if (enumType[key] === fieldType) {
                return key;
            }
        }

        return 'unknown';
    }

    private static _mapNameToDbfFieldType(name: string): DbfFieldType {
        const enumType = DbfFieldType as any;
        const found = Object.keys(enumType).some(k => k === name);
        if (found) {
            return enumType[name] as DbfFieldType;
        } else {
            return DbfFieldType.character;
        }
    }

    private static _toDbfField(field: Field | DbfField) {
        let dbfField = field instanceof DbfField ? field : ShapefileFeatureSource._mapFieldToDbfField(field);
        return dbfField;
    }

    private static _filename(filePath: string) {
        return path.basename(filePath).replace(/(.shp)|(.shx)|(.dbf)$/i, '');
    }
}