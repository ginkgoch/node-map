import { GeoJsonFeatureSource, FeatureLayer, GeneralStyle, Render } from '..';
import TestUtils from '../shared/TestUtils';

const compareImage = TestUtils.compareImageFunc(name => './tests/data/layers/' + name);

describe('GeoJsonFeatureSource', () => {
    it('open with empty', async () => {
        let source = new GeoJsonFeatureSource();
        await source.open();
        expect(source._interFeatures.features.length).toBe(0);
        expect(source._interFields.length).toBe(0);
    });

    it('open with geoJSON feature', async () => {
        let source = new GeoJsonFeatureSource(geoJSON_Feature);
        await source.open();
        expect(source._interFeatures.features.length).toBe(1);
        expect(source._interFields.length).toBe(2);
        expect(source._interFields[0].name).toEqual('prop0');
        expect(source._interFields[1].name).toEqual('prop1');

        let features = await source.features();
        expect(features[0].properties.get('prop0')).toEqual('value0');
        expect(features[0].properties.get('prop1')).toEqual(0.0);
    });

    it('open with geoJSON feature collection', async () => {
        let source = new GeoJsonFeatureSource(geoJSON_FeatureCollection);
        await source.open();
        expect(source._interFeatures.features.length).toBe(3);
        expect(source._interFields.length).toBe(2);
        expect(source._interFields[0].name).toEqual('prop0');
        expect(source._interFields[1].name).toEqual('prop1');

        let features = await source.features();
        expect(features[0].properties.get('prop0')).toEqual('value0');
        expect(features[1].properties.get('prop0')).toEqual('value0');
        expect(features[1].properties.get('prop1')).toEqual(0.0);
        expect(features[2].properties.get('prop1')).toEqual({ "this": "that" });
    });

    it('open with geoJSON feature file', async () => {
        let source = new GeoJsonFeatureSource('./tests/data/layers/layer-geoJSON.json');
        await source.open();
        expect(source._interFeatures.features.length).toBe(3);
        expect(source._interFields.length).toBe(2);
        expect(source._interFields[0].name).toEqual('prop0');
        expect(source._interFields[1].name).toEqual('prop1');

        let features = await source.features();
        expect(features[0].properties.get('prop0')).toEqual('value0');
        expect(features[1].properties.get('prop0')).toEqual('value0');
        expect(features[1].properties.get('prop1')).toEqual(0.0);
        expect(features[2].properties.get('prop1')).toEqual({ "this": "that" });
    });

    it('draw with geoJSON', async () => {
        let source = new GeoJsonFeatureSource(geoJSON_FeatureCollection);
        let layer = new FeatureLayer(source);
        layer.styles.push(new GeneralStyle('#e34a33', 'cccc', 4, 20));

        await layer.open();
        const envelope = await layer.envelope();
        const render = Render.create(256, 256, envelope);
        render.drawBackground('white');
        await layer.draw(render);
        render.flush();

        compareImage(render.image, 'layer-geoJSON.png');
    });

    it('toJSON', async () => {
        let oldSource = new GeoJsonFeatureSource('./tests/data/layers/layer-geoJSON.json');
        let json = oldSource.toJSON();

        let source = GeoJsonFeatureSource.parseJSON(json);
        await source.open();
        expect(source._interFeatures.features.length).toBe(3);
        expect(source._interFields.length).toBe(2);
        expect(source._interFields[0].name).toEqual('prop0');
        expect(source._interFields[1].name).toEqual('prop1');

        let features = await source.features();
        expect(features[0].properties.get('prop0')).toEqual('value0');
        expect(features[1].properties.get('prop0')).toEqual('value0');
        expect(features[1].properties.get('prop1')).toEqual(0.0);
        expect(features[2].properties.get('prop1')).toEqual({ "this": "that" });
    });
});

const geoJSON_Feature = {
    "type": "Feature",
    "geometry": {
        "type": "LineString",
        "coordinates": [
            [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
        ]
    },
    "properties": {
        "prop0": "value0",
        "prop1": 0.0
    }
};

const geoJSON_FeatureCollection = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [102.0, 0.5]
            },
            "properties": {
                "prop0": "value0"
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0]
                ]
            },
            "properties": {
                "prop0": "value0",
                "prop1": 0.0
            }
        },
        {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0],
                    [100.0, 1.0], [100.0, 0.0]]
                ]
            },
            "properties": {
                "prop0": "value0",
                "prop1": { "this": "that" }
            }
        }
    ]
};
