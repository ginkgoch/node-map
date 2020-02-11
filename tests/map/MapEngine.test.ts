import { ShapefileFeatureSource, FeatureLayer } from '..';
import { MapEngine, LeafletMapOptions } from '../../src/map';
import { FillStyle } from '../../src/styles';
import TestUtils from '../shared/TestUtils';
import { LayerGroup, MemoryFeatureSource, Srs } from '../../src/layers';
import { Point, Constants } from '../../src';

const compareImage = TestUtils.compareImageFunc(name => './tests/data/map/' + name);

describe('Map', () => {
    it('constructor', () => {
        let map = new MapEngine();
        expect(map.scales.length).toBe(20);
        expect(map.srs.unit).toBe('m');

        map = new MapEngine(256, 256, 'WGS84');
        expect(map.srs.unit).toEqual('degrees');
    });

    it('push groups', () => {
        let map = new MapEngine();
        map.pushGroups(new LayerGroup(), new LayerGroup());
        expect(map.groups.length).toBe(2);
    });

    it('get layer', () => {
        let map = new MapEngine();
        const layer1 = new FeatureLayer(new MemoryFeatureSource());
        layer1.name = 'layer1';
        map.pushLayers([layer1]);

        const layer2 = new FeatureLayer(new MemoryFeatureSource());
        layer2.name = 'layer1';
        map.pushLayers([layer2], 'OL2');

        const layer1_1 = map.layer('layer1', 'Default');
        expect(layer1_1).not.toBeUndefined();
        expect(layer1_1).toBe(layer1);

        const layer1_2 = map.layer('layer1', 'OL2');
        expect(layer1_2).toBe(layer2);

        const layer1_3 = map.layer('layer1', 'OL3');
        expect(layer1_3).toBeUndefined();
    }); 

    it('draw', async () => {
        const map = getMap();

        const image = await map.draw();
        compareImage(image, 'us-states-1.png');
    });

    it('json', () => {
        const map = getMap();
        const json = map.toJSON();
        const newMap = MapEngine.parseJSON(json);
        const newJSON = newMap.toJSON();
        expect(newJSON).toEqual(json);
    });

    it('intersection', async () => {
        const map = getMap();
        map.srs = new Srs('WGS84');
        map.layer('USStates')!.source.srs = 'WGS84';

        const point = new Point(-99.13513183593751, 31.481379984249294);
        const features = await map.intersection(point, 'WGS84', 3);
        
        expect(features.length).toBe(1);
        expect(features[0].layer).toEqual(map.layer('USStates')!.name);
        expect(features[0].features.length).toBe(1);
        expect(features[0].features[0].properties.get('STATE_NAME')).toEqual('Texas');
    });

    it('intersection without invisible', async () => {
        const map = getMap();
        map.srs = new Srs('WGS84');
        map.layer('USStates')!.source.srs = 'WGS84';
        map.layer('USStates')!.minimumScale = Constants.DEFAULT_SCALES[2];

        const point = new Point(-99.13513183593751, 31.481379984249294);
        const features = await map.intersection(point, 'WGS84', 3);
        
        expect(features.length).toBe(0);
    });

    it('intersection with invisible', async () => {
        const map = getMap();
        map.srs = new Srs('WGS84');
        map.layer('USStates')!.source.srs = 'WGS84';
        map.layer('USStates')!.minimumScale = Constants.DEFAULT_SCALES[2];

        const point = new Point(-99.13513183593751, 31.481379984249294);
        const features = await map.intersection(point, 'WGS84', 3, 5, true);
        
        expect(features.length).toBe(1);
    });

    it('fromOptions', () => {
        let mapEngine = MapEngine.fromOptions(LeafletMapOptions.DEFAULT);
        expect(mapEngine.width).toBe(256);
        expect(mapEngine.height).toBe(256);
        expect(mapEngine.srs.projection).toBe('EPSG:3857');
        expect(mapEngine.scales.length).toBe(20);

        mapEngine = MapEngine.fromOptions(LeafletMapOptions.WGS84);
        expect(mapEngine.width).toBe(256);
        expect(mapEngine.height).toBe(256);
        expect(mapEngine.srs.projection).toBe('EPSG:4326');
        expect(mapEngine.scales.length).toBe(19);

        mapEngine = MapEngine.fromOptions({width: 512, crs: 'EPSG:900913'});
        expect(mapEngine.width).toBe(512);
        expect(mapEngine.height).toBe(256);
        expect(mapEngine.srs.projection).toBe('EPSG:900913');
        expect(mapEngine.scales.length).toBe(20);
    });
});

function getMap() {
    const source = new ShapefileFeatureSource('./tests/data/layers/USStates.shp');
    const layer = new FeatureLayer(source);
    layer.pushStyles([new FillStyle('yellow', 'blue', 1)]);

    const map = new MapEngine(512, 256);
    map.pushLayers([layer]);
    return map;
}