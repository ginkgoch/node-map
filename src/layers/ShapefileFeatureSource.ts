import fs from "fs";
import path from 'path';
import _ from "lodash";
import { Shapefile, DbfField, DbfFieldType, ShapefileType } from "ginkgoch-shapefile";
import { IEnvelope, Feature, Envelope, IFeature } from "ginkgoch-geom";
import { FeatureSource, Field } from ".";
import { Validator, JSONKnownTypes } from '../shared';
import { Projection, Srs } from "./Projection";
import { RTIndex } from "../indices";

const DBF_FIELD_DECIMAL = 'decimal';

export class ShapefileFeatureSource extends FeatureSource {
    flag: string;
    private _filePath: string;
    private _shapefile?: Shapefile;

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

    public get filePath() {
        return this._filePath;
    }

    public set filePath(filePath: string) {
        this._filePath = filePath;
        if (this.name === '' || this.name.match(/^unknown/i)) {
            this.name = ShapefileFeatureSource._filename(filePath);
        }
    }

    public get shapeType(): ShapefileType {
        Validator.checkOpened(this);
        return this.__shapefile.shapeType();
    }

    protected _toJSON() {
        const json = super._toJSON();
        json.flag = this.flag;
        json.filePath = this.filePath;
        return json;
    }

    static parseJSON(json: any) {
        const source = new ShapefileFeatureSource();
        source.name = json.name;
        source.projection = Projection.parseJSON(json.projection);
        source.flag = json.flag;
        source.filePath = json.filePath;
        return source;
    }

    /**
     * @override
     */
    get editable() {
        return true;
    }

    protected async _open() {
        Validator.checkFilePathNotEmptyAndExist(this.filePath);

        this._shapefile = new Shapefile(this.filePath, this.flag);
        this._shapefile.open();

        const projFilePath = this.filePath.replace(/.shp/i, '.prj');
        if (this.projection.from.projection === undefined && fs.existsSync(projFilePath)) {
            this.projection.from = new Srs(fs.readFileSync(projFilePath).toString('utf8'));
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

    protected async _features(envelope: IEnvelope, fields: string[]): Promise<Feature[]> {
        let features: Array<Feature>;
        if (this.indexEnabled && this.index !== undefined) {
            const ids = this.index.intersections(envelope);
            features = new Array<Feature>();
            for(let id of ids) {
                const feature = this.__shapefile.get(parseInt(id));
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

    protected async _fields(): Promise<Field[]> {
        const fields = this.__shapefile.fields(true) as DbfField[];
        return fields.map(f => this._mapDbfFieldToField(f));
    }

    protected async _envelope(): Promise<Envelope> {
        return this.__shapefile.envelope();
    }

    protected async _feature(id: number, fields: string[]): Promise<Feature | undefined> {
        const feature = this.__shapefile.get(id, fields);
        return feature === null ? undefined : feature;
    }

    protected async _properties(fields: string[]): Promise<Array<Map<string, any>>> {
        return this.__shapefile._dbf.value.records({ fields })
            .filter(r => !r.deleted)
            .map(r => _.clone(r.values));
    }

    protected async _push(feature: IFeature) {
        this.__shapefile.push(feature);
    }

    protected async _update(feature: IFeature) {
        this.__shapefile.update(feature);
    }

    protected async _remove(id: number) {
        this.__shapefile.remove(id);
    }

    protected async _pushField(field: DbfField): Promise<void>
    protected async _pushField(field: Field): Promise<void>
    protected async _pushField(field: Field | DbfField): Promise<void> {
        let dbfField = this._toDbfField(field);
        this.__shapefile.pushField(dbfField);
    }

    protected async _updateField(sourceFieldName: string, newField: Field): Promise<void>
    protected async _updateField(sourceFieldName: string, newField: DbfField): Promise<void>
    protected async _updateField(sourceFieldName: string, newField: Field | DbfField): Promise<void> {
        let dbfField = this._toDbfField(newField);
        this.__shapefile.updateField(sourceFieldName, dbfField);
    }

    protected async _removeField(fieldName: string): Promise<void> {
        this.__shapefile.removeField(fieldName);
    }

    protected async _flushFields() {
        this.__shapefile.flushFields();
    }

    private get __shapefile() {
        return this._shapefile as Shapefile;
    }

    private _mapDbfFieldToField(dbfField: DbfField) {
        const fieldType = this._mapDbfFieldTypeToName(dbfField.type);
        const field = new Field(dbfField.name, fieldType, dbfField.length);
        field.extra.set(DBF_FIELD_DECIMAL, dbfField.decimal);
        return field;
    }

    private _mapFieldToDbfField(field: Field) {
        const fieldType = this._mapNameToDbfFieldType(field.type);
        const dbfField = new DbfField(field.name, fieldType, field.length);
        if (field.extra.has(DBF_FIELD_DECIMAL)) {
            dbfField.decimal = field.extra.get(DBF_FIELD_DECIMAL);
        }

        return dbfField;
    }

    private _mapDbfFieldTypeToName(fieldType: DbfFieldType) {
        const enumType = DbfFieldType as any;
        for (let key in enumType) {
            if (enumType[key] === fieldType) {
                return key;
            }
        }

        return 'unknown';
    }

    private _mapNameToDbfFieldType(name: string): DbfFieldType {
        const enumType = DbfFieldType as any;
        const found = Object.keys(enumType).some(k => k === name);
        if (found) {
            return enumType[name] as DbfFieldType;
        } else {
            return DbfFieldType.character;
        }
    }

    private _toDbfField(field: Field | DbfField) {
        let dbfField = field instanceof DbfField ? field : this._mapFieldToDbfField(field);
        return dbfField;
    }

    private static _filename(filePath: string) {
        return path.basename(filePath).replace(/(.shp)|(.shx)|(.dbf)$/i, '');
    }
}