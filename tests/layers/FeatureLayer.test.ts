import { LineString, Feature } from "ginkgoch-geom";
import { MemoryFeatureSource, FeatureLayer, Render, LineStyle } from "..";
import TestUtils from "../shared/TestUtils";

const compareImage = TestUtils.compareImageFunc(name => './tests/data/layers/' + name);

describe('FeatureLayer', () => {
    it('draw', async () => {
        const layer = lineLayer();

        await layer.open();
        const envelope = await layer.envelope();
        const render = Render.create(256, 256, envelope);
        await layer.draw(render);
        render.flush();

        compareImage(render.image, 'layer-line.png');
    });

    it('sample', async () => {
        const layer = lineLayer();
        await layer.open();
        const image = await layer.thumbnail();
        layer.close();

        compareImage(image, 'layer-sample.png');
    });
});

function lineLayer() {
    const source = new MemoryFeatureSource();
    source.push(new Feature(new LineString([
        { x: -100, y: 80 },
        { x: -40, y: -80 },
        { x: 0, y: 20 },
        { x: 40, y: -80 },
        { x: 100, y: 80 }
    ])));

    const layer = new FeatureLayer(source);
    layer.styles.push(new LineStyle('#886600', 4));
    return layer;
}