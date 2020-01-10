import fs from 'fs';
import _ from 'lodash';
import csvParse from 'csv-parse/lib/sync';
import { MemoryFeatureSource } from '..';
import { JSONKnownTypes } from '../..';
import { Projection } from '../Projection';
import { Feature, GeometryFactory } from 'ginkgoch-geom';
import { Field } from '../Field';

export interface CSVFieldOptions {
    geomField?: string
    fields?: string[]
    hasFieldsRow?: boolean
}

export class CSVFeatureSource extends MemoryFeatureSource {
    fieldOptions: CSVFieldOptions;
    delimiter: string = ','

    constructor(public filePath?: string, fieldOptions?: CSVFieldOptions, name?: string) {
        super();

        this.type = JSONKnownTypes.geoJSONFeatureSource;
        this.name = name || this.name;
        this.fieldOptions = _.defaults(fieldOptions, { });
    }

    async _open(): Promise<void> {
        CSVFeatureSource.validate(this);

        const csvContent = fs.readFileSync(this.filePath!, { flag: 'r' });
        const csvParseOption = {
            trim: true,
            skip_lines_with_error: true,
            columns: this.getCSVColumnsOption()
        }

        const records = csvParse(csvContent, csvParseOption);
        if (records.length === 0) return;

        const fields = Object.keys(records[0]).filter(f => f !== this.fieldOptions.geomField);
        this._interFields.length = 0;
        this._interFields.push(...(fields.map(f => new Field(f))));

        this._interFeatures.features.length = 0;
        for (let record of records) {
            let feature = new Feature(GeometryFactory.create(record[this.fieldOptions.geomField!]));
            for (let field of fields) {
                feature.properties.set(field, record[field]);
            }

            this._interFeatures.features.push(feature);
        }
    }

    async _close() {
        this._interFields.length = 0;
        this._interFeatures.features.length = 0;
    }

    _toJSON(): any {
        const json: any = {
            type: this.type,
            name: this.name,
            projection: this.projection.toJSON(),
            filePath: this.filePath,
            delimiter: this.delimiter,
            fieldOptions: this.fieldOptions
        };

        return json;
    }

    /**
     * @override 
     */
    get editable() {
        return false;
    }

    private getCSVColumnsOption(): boolean|Array<string> {
        if (this.fieldOptions.hasFieldsRow) {
            return this.fieldOptions.hasFieldsRow;
        } else if (this.fieldOptions.fields) {
            return this.fieldOptions.fields;
        } else {
            throw new Error(`Field options is not properly set. ${JSON.stringify(this.fieldOptions)}`);
        }
    }

    static parseJSON(json: any) {
        const source = new CSVFeatureSource();
        source.name = json.name;
        source.projection = Projection.parseJSON(json.projection);
        source.filePath = json.filePath;
        source.delimiter = json.delimiter;
        source.fieldOptions = json.fieldOptions;
        return source;
    }

    private static validate(source: CSVFeatureSource) {
        if (source.filePath === undefined) {
            throw new Error(`Property 'filePath' is not defined.`)
        }

        if (source.fieldOptions.geomField === undefined) {
            throw new Error(`Property 'geomField' is not defined.`);
        }
        
        if (source.fieldOptions.fields === undefined && !source.fieldOptions.hasFieldsRow) {
            throw new Error(`Fields cannot be identified. Set either 'fields' array or 'hasFieldsRow' to true if the CSV file contains the fields as the first row.`);
        }
    }
}