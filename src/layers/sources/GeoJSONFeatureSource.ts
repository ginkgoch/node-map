import fs from 'fs';
import _ from 'lodash';
import { MemoryFeatureSource } from '..';
import { Feature, FeatureCollection } from 'ginkgoch-geom';
import { Field } from '../Field';
import { JSONKnownTypes } from '../..';
import { Projection } from '../Projection';

export class GeoJSONFeatureSource extends MemoryFeatureSource {
    _geoJSON?: any|string = undefined;

    constructor(geoJSON?: string|any, name?: string) {
        super();

        this.name = name || this.name;
        this.type = JSONKnownTypes.geoJSONFeatureSource;
        this._geoJSON = geoJSON;
    }

    get geoJSON(): any|string|undefined {
        return this._geoJSON;
    }

    set geoJSON(geoJSON: any|string|undefined) {
        this._geoJSON = geoJSON;
    }

    async _open(): Promise<void> {
        let tempGeoJSON = this._geoJSON;
        if (this._geoJSON === undefined) {
            console.debug(`geoJSON is not specified.`);
            return;
        } else if (typeof this._geoJSON === 'string') {
            let content = fs.readFileSync(this._geoJSON, { flag: 'r'}).toString();
            tempGeoJSON = JSON.parse(content);
        }

        this._interFeatures.features.length = 0;
        const contentJSONType = tempGeoJSON.type;

        switch (contentJSONType.toUpperCase()) {
            case 'FEATURECOLLECTION': 
                let featureCollection = FeatureCollection.parseJSON(tempGeoJSON);
                featureCollection.features.forEach(f => {
                    this._interFeatures.features.push(f);
                });
                break;
            case 'FEATURE':
                let feature = Feature.parseJSON(tempGeoJSON);
                this._interFeatures.features.push(feature);
        }

        let fields = _.chain(this._interFeatures.features)
            .flatMap(f => Array.from(f.properties.keys()))
            .uniq()
            .map(k => new Field(k, 'string'))
            .value();

        this._interFields.length = 0;
        fields.forEach(f => this._interFields.push(f));
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
            geoJSON: this._geoJSON
        };

        return json;
    }

    /**
     * @override 
     */
    get editable() {
        return false;
    }

    static parseJSON(json: any) {
        const source = new GeoJSONFeatureSource();
        source.name = json.name;
        source.projection = Projection.parseJSON(json.projection);
        source._geoJSON = json.geoJSON;
        return source;
    }
}