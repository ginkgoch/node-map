import { FeatureLayer } from "./FeatureLayer";
import { Srs } from "./Projection";
import { ShapefileFeatureSource } from "./sources/ShapefileFeatureSource";
import { Field } from ".";
import { MemoryFeatureSource } from "./sources/MemoryFeatureSource";

export class LayerFactory {

    /**
     * Create {FeatureLayer} by specific url format.
     * @param sourceURL The url to create a {FeatureLayer}. 
     * @description
     * {FeatureLayer} is a uniform maintainer for {FeatureSource}. It describes how the features in {FeatureSource} are rendered. 
     * This method is a shortcut of creating a feature layer with one line of code.
     * URL is formed with protocol, path and parameters. 
     * - Protocol is defined as the abbr. of the feature source. e.g. shp = ShapefileFeatureSource, mem = MemoryFeatureSource.
     * - Path is used for the concrete path or name.
     * - Parameters are used for some optional configurations.
     * 
     * 1. Create a FeatureLayer with a ShapefileFeatureSource.
     * ```typescript
     * let layer = FeatureLayerFactory.create(new URL('shp://./cntry02.shp'));
     * ```
     * 2. Create a FeatureLayer with a ShapefileFeatureSource with rs+ flag.
     * ```typescript
     * let layer = FeatureLayerFactory.create(new URL('shp://./cntry02.shp?flag=rs+'));
     * ```
     * 3. Create a FeatureLayer with a MemoryFeatureSource with name = 'dynamic' and fields = ['name', 'recid'].
     * ```typescript
     * let layer = FeatureLayerFactory.create(new URL('mem://dynamic?fields=name|c,recid|n,landlocked|b'));
     * ```
     * @returns {FeatureLayer} The feature layer with specified feature source.
     */
    static create(sourceURL: URL) {
        switch (sourceURL.protocol) {
            case 'mem:':
                return this._createMemoryFeatureLayer(sourceURL);
            case 'shp:':
                return this._createShapefileFeatureLayer(sourceURL);
            default:
                throw new Error(`Unsupported feature layer protocol ${sourceURL.protocol}.`);
        }
    }

    private static _createShapefileFeatureLayer(sourceURL: URL) {
        const params = this._parseGeneralParams(sourceURL);
        const flag = sourceURL.searchParams.get('flag') || undefined;

        const source = new ShapefileFeatureSource(params.pathname, flag, params.name);
        if (params.srs) {
            source.projection.from = params.srs;
        }

        const layer = new FeatureLayer(source);
        return layer;
    }

    private static _createMemoryFeatureLayer(sourceURL: URL) {
        const params = this._parseGeneralParams(sourceURL);
        const fields = new Array<Field>();
        if (sourceURL.searchParams.has('fields')) {
            sourceURL.searchParams.get('fields')!.split(',').map(f => {
                const fieldInfo = f.split('|');
                let fieldName: string|undefined;
                let fieldType: string|undefined;
                let fieldLength: number|undefined;
                if (fieldInfo.length > 0) {
                    fieldName = fieldInfo[0];
                } 
                if (fieldInfo.length > 1) {
                    fieldType = fieldInfo[1];
                }
                if (fieldInfo.length > 2) {
                    fieldLength = parseInt(fieldInfo[2]);
                }

                return new Field(fieldName, fieldType, fieldLength);
            }).forEach(f => fields.push(f));
        }

        const source = new MemoryFeatureSource(undefined, fields, params.pathname);
        if (params.srs) {
            source.projection.from = params.srs;
        }

        const layer = new FeatureLayer(source);
        return layer;
    }

    /**
     * General parameters are name, srs
     */
    private static _parseGeneralParams(sourceURL: URL) {
        const result: { pathname: string, name?: string, srs?: Srs } = { pathname: sourceURL.hostname + sourceURL.pathname };
        result.name = sourceURL.searchParams.get('name') || undefined;

        const proj = sourceURL.searchParams.get('srs');
        if (proj !== null) {
            result.srs = new Srs(proj);
        }

        return result;
    }
}