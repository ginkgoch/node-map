import { ShapefileFeatureSource, FeatureLayer } from '..';
import { GKMap } from '../../src/map';
import { FillStyle } from '../../src/styles';
import TestUtils from '../shared/TestUtils';

const compareImage = TestUtils.compareImageFunc(name => './tests/data/map/' + name);

describe('Map', () => {
    it('draw', async () => {
        const source = new ShapefileFeatureSource('./tests/data/layers/USStates.shp');
        const layer = new FeatureLayer(source);
        layer.pushStyles([new FillStyle('yellow', 'blue', 1)]);

        const map = new GKMap(512, 256);
        map.pushLayers([layer]);

        const image = await map.draw();
        compareImage(image, 'us-states-1.png');
    });
});