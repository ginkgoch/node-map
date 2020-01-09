import fs from 'fs';
import _ from 'lodash';
import { MemoryFeatureSource } from '.';
import { JSONKnownTypes } from '..';
import { Projection } from './Projection';

export interface CSVFieldOptions {
    geomField?: string
    fields?: string[]
    hasFieldsRow?: boolean
}

export class CSVFeatureSource extends MemoryFeatureSource {
    fieldOptions: CSVFieldOptions;

    constructor(public filePath?: string, fieldOptions?: CSVFieldOptions, name?: string) {
        super();

        this.type = JSONKnownTypes.geoJSONFeatureSource;
        this.name = name || this.name;
        this.fieldOptions = _.defaults(fieldOptions, { });
    }

    async _open(): Promise<void> {
        if (this.fieldOptions.geomField === undefined) {
            throw new Error(`Property 'geomField' is not defined.`);
        }
        
        if (this.fieldOptions.fields === undefined && !this.fieldOptions.hasFieldsRow) {
            throw new Error(`Fields cannot be identified. Set either 'fields' array or 'hasFieldsRow' to true if the CSV file contains the fields as the first row.`);
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
            projection: this.projection.toJSON()
        };

        json.filePath = this.filePath;
        return json;
    }

    static parseJSON(json: any) {
        const source = new CSVFeatureSource();
        source.name = json.name;
        source.projection = Projection.parseJSON(json.projection);
        source.filePath = json.filePath;
        return source;
    }
}