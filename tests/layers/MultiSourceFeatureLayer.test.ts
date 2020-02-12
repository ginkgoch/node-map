import { ShapefileFeatureSource, MultiSourceFeatureLayer, GeneralStyle, Render, Envelope } from '..';
import TestUtils from '../shared/TestUtils';
const compareImage = TestUtils.compareImageFunc(name => './tests/data/layers/' + name);

describe('MultiSourceFeatureLayer', () => {
    it('draw', async () => {
        let layer = getLayer();

        await layer.open();
        const envelope = await layer.envelope();
        const render = Render.create(256, 256, envelope);
        await layer.draw(render);
        render.flush();

        compareImage(render.image, 'layer-multi-source.png');
    });

    it('envelope', async () => {
        let layer = getLayer();
        await layer.open();
        let envelope = await layer.envelope();

        expect(envelope).toEqual(new Envelope(-178.21502685546875, 18.924781799316406, -65, 71.40664672851562));
    });
});

function getLayer() {
    let statesFilePath = './tests/data/layers/USStates.shp';
    let latlongFilePath = './tests/data/layers/latlong.shp';

    let statesSource = new ShapefileFeatureSource(statesFilePath);
    let latlongSource = new ShapefileFeatureSource(latlongFilePath);
    let layer = new MultiSourceFeatureLayer([statesSource, latlongSource]);
    layer.styles.push(new GeneralStyle('red', 'blue', 1));

    return layer;
}
