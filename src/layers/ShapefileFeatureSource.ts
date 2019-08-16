import _ from "lodash";
import { Shapefile, DbfField, DbfFieldType } from "ginkgoch-shapefile";
import { IEnvelope, Feature, Envelope, IFeature } from "ginkgoch-geom";
import { Field } from "./Field";
import { Validator } from '../shared';
import { FeatureSource } from "./FeatureSource";

const DBF_FIELD_DECIMAL = 'decimal';

export class ShapefileFeatureSource extends FeatureSource {
    flag: string;
    filePath: string;
    private _shapefile?: Shapefile;

    constructor(filePath?: string, flag: string = 'rs') {
        super();

        this.filePath = filePath || '';
        this.flag = flag;
    }

    protected _json() {
        return {
            flag: this.flag,
            filePath: this.filePath
        };
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
    }

    protected async _close() {
        if (this._shapefile) {
            this._shapefile.close();
            this._shapefile = undefined;
        }
    }

    protected async _features(envelope: IEnvelope, fields: string[]): Promise<Feature[]> {
        const features = this.__shapefile.records({ envelope,  fields });
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
        for(let key in enumType) {
            if(enumType[key] === fieldType) {
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
}