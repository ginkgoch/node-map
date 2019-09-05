import { ShapefileFeatureSource, FeatureLayer } from '..';
import { GKMap } from '../../src/map';
import { FillStyle } from '../../src/styles';
import TestUtils from '../shared/TestUtils';

const compareImage = TestUtils.compareImageFunc(name => './tests/data/map/' + name);

describe('Map', () => {
    it('constructor', () => {
        let map = new GKMap();
        expect(map.scales.length).toBe(20);
        expect(map.srs.unit).toBe('m');

        map = new GKMap(256, 256, 'WGS84');
        expect(map.srs.unit).toEqual('degrees');
    });

    it('draw', async () => {
        const map = getMap();
        const image = await map.draw();
        compareImage(image, 'us-states-1.png');
    });

    it('json', () => {
        const map = getMap();
        const json = map.toJSON();
        const newMap = GKMap.parseJSON(json);
        const newJSON = newMap.toJSON();
        expect(newJSON).toEqual(json);
    });
});

function getMap() {
    const source = new ShapefileFeatureSource('./tests/data/layers/USStates.shp');
    const layer = new FeatureLayer(source);
    layer.pushStyles([new FillStyle('yellow', 'blue', 1)]);

    const map = new GKMap(512, 256);
    map.pushLayers([layer]);
    return map;
}