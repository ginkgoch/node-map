import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import csvParse from 'csv-parse/lib/sync';
import { MemoryFeatureSource } from '..';
import { JSONKnownTypes } from '../..';
import { Projection } from '../Projection';
import { Feature, GeometryFactory, Point, Geometry, GeometryType } from 'ginkgoch-geom';
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
     * @param {string} delimiter The delimiter. 
     * @param {string} name The feature source name. 
     */
    constructor(public filePath?: string, fieldOptions?: CSVFieldOptions, delimiter: string = ',', name?: string) {
        super();

        this.type = JSONKnownTypes.geoJSONFeatureSource;
        this.name = name || (filePath !== undefined ? path.basename(filePath!, '.csv') : this.name);
        this.fieldOptions = _.defaults(fieldOptions, {});
    }

    async _open(): Promise<void> {
        CSVFeatureSource.validate(this);

        const csvContent = fs.readFileSync(this.filePath!, { flag: 'r' });
        const csvParseOption = {
            trim: true,
            delimiter: this.delimiter,
            skip_lines_with_error: true,
            columns: this.getCSVColumnsOption()
        }

        const records = csvParse(csvContent, csvParseOption);
        if (records.length === 0) return;

        const fields = this.getFieldNames(this.fieldOptions.fields || Object.keys(records[0]));
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

    private getFieldNames(allColumns: string[]): string[] {
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

        return allColumns.filter(c => !_.includes(geomColumns, c));
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

    public static create(filePath: string, delimiter: string, fieldOptions: CSVFieldOptions, features: Array<Feature>, encoding: string = 'utf8') {
        if (fieldOptions.fields === undefined || fieldOptions.fields.length === 0) {
            throw new Error('CSV fields must be defined.');
        }

        fieldOptions = _.defaults(fieldOptions, { geomField: 'WKT' });

        let convertGeom: (f: Feature) => string[];
        let header = [...fieldOptions.fields!];
        if (typeof fieldOptions.geomField === 'string') {
            header.push(fieldOptions.geomField);
            convertGeom = f => [f.geometry.toWKT()];
        }
        else {
            let { x, y } = fieldOptions.geomField!;
            header.push(x, y);
            convertGeom = f => {
                if (f.geometry.type === GeometryType.Point) {
                    let { x, y } = <Point>f.geometry;
                    return [x.toString(), y.toString()];
                }
                else {
                    return ['NaN', 'NaN'];
                }
            };
        }

        let escape = (s: any) => {
            if (s === undefined) {
                return '';
            }

            s = s.toString();
            if (s.includes(delimiter)) {
                s = `"${s}"`;
            }

            return s;
        };

        let fd = fs.openSync(filePath, 'w');
        fs.writeSync(fd, header.map(escape).join(delimiter) + '\n', undefined, encoding);

        features.forEach(f => {
            let row: Array<string> = fieldOptions.fields!.map(field => f.properties.has(field) ? f.properties.get(field).toString() : '');
            row?.push(...convertGeom(f));
            fs.writeSync(fd, row.map(escape).join(delimiter) + '\n', undefined, encoding);
        });

        fs.closeSync(fd);
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