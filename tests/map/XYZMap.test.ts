import { ShapefileFeatureSource, FeatureLayer } from "..";
import { FillStyle } from "../../src/styles";
import { XYZMap } from "../../src/map";
import TestUtils from "../shared/TestUtils";
import { Srs } from "../../src/layers";

const compareImage = TestUtils.compareImageFunc(name => './tests/data/map/' + name);

describe('XYZMap', () => {
    it('image', async () => {
        const map = getMap();
        const image = await map.xyz(0, 0, 0);
        compareImage(image, 'xyz-1.png');
    });
});

function getMap() {
    const source = new ShapefileFeatureSource('./tests/data/layers/USStates.shp');
    const layer = new FeatureLayer(source);
    layer.pushStyles([new FillStyle('yellow', 'blue', 1)]);

    const map = new XYZMap();
    map.srs = new Srs('WGS84');
    map.pushLayers([layer]);
    return map;
}