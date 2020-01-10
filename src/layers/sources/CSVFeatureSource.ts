import fs from 'fs';
import _ from 'lodash';
import csvParse from 'csv-parse/lib/sync';
import { MemoryFeatureSource } from '..';
import { JSONKnownTypes } from '../..';
import { Projection } from '../Projection';
import { Feature, GeometryFactory, Point, Geometry } from 'ginkgoch-geom';
import { Field } from '../Field';

export interface CSVFieldOptions {
    fields?: string[]
    hasFieldsRow?: boolean
    geomField?: string | { x: string, y: string },
}

const geomFieldUndefinedError = new Error(`Property 'geomField' is not properly defined.`);
export class CSVFeatureSource extends MemoryFeatureSource {
    fieldOptions: CSVFieldOptions;
    delimiter: string = ','

    /**
     * Constructs a `CSVFeatureSource` instance.
     * @param {string} filePath The CSV file path.
     * @param {CSVFieldOptions} fieldOptions The CSV field options. e.g. { geoField: {x:'longitude', y:'latitude'}, hasFieldsRow: true }
     * @param {string} name The feature source name. 
     */
    constructor(public filePath?: string, fieldOptions?: CSVFieldOptions, name?: string) {
        super();

        this.type = JSONKnownTypes.geoJSONFeatureSource;
        this.name = name || this.name;
        this.fieldOptions = _.defaults(fieldOptions, {});
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

        const fields = this.getFieldNames(records[0]);
        this._interFields.length = 0;
        this._interFields.push(...(fields.map(f => new Field(f))));

        this._interFeatures.features.length = 0;
        for (let record of records) {
            let geometry = this.parseGeometry(record);
            if (geometry === undefined) {
                continue;
            }

            let feature = new Feature(geometry);
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

    private getFieldNames(record: any): string[] {
        let geomColumns = new Array<string>();
        if (typeof this.fieldOptions.geomField === 'string') {
            geomColumns.push(this.fieldOptions.geomField);
        } else if (this.fieldOptions.geomField !== undefined) {
            let xCol = this.fieldOptions.geomField.x;
            let yCol = this.fieldOptions.geomField.y;
            if (xCol !== undefined && yCol !== undefined) {
                geomColumns.push(xCol);
                geomColumns.push(yCol);
            }
        }

        return Object.keys(record).filter(c => !_.includes(geomColumns, c))
    }

    private parseGeometry(record: any): Geometry | undefined {
        if (typeof this.fieldOptions.geomField === 'string') {
            return GeometryFactory.create(record[this.fieldOptions.geomField]);
        } else if (this.fieldOptions.geomField !== undefined) {
            let xCol = this.fieldOptions.geomField.x;
            let yCol = this.fieldOptions.geomField.y;
            if (xCol === undefined || yCol === undefined) {
                throw geomFieldUndefinedError;
            }

            let x = parseFloat(record[xCol]);
            let y = parseFloat(record[yCol]);
            if (!Number.isNaN(x) && !Number.isNaN(y)) {
                return new Point(x, y);
            } else {
                return undefined;
            }
        } else {
            throw geomFieldUndefinedError;
        }
    }

    private getCSVColumnsOption(): boolean | Array<string> {
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
            throw geomFieldUndefinedError;
        }

        if (source.fieldOptions.fields === undefined && !source.fieldOptions.hasFieldsRow) {
            throw new Error(`Fields cannot be identified. Set either 'fields' array or 'hasFieldsRow' to true if the CSV file contains the fields as the first row.`);
        }
    }
}