import { FillStyle } from "../../src/styles";
import { Feature, Polygon, LinearRing } from "ginkgoch-geom";
import { Render } from "../../src/render";
import TestUtils from "../shared/TestUtils";

const compareImage = TestUtils.compareImageFunc(TestUtils.resolveStyleDataPath);

describe('FillStyle', () => {
    it('draw - 1', () => {
        const canvas = Render.create(64, 64);
        const style = new FillStyle('#00ff00', 'red', 4);
        const geom = gen();
        const feature = new Feature(geom);
        style.draw(feature, canvas);
        canvas.flush();

        compareImage(canvas.image, 'fillstyle-1.png');
    });
});

function gen() {
    const coordinates = [[0, 80], [-160, -70], [160, -70], [0, 80]].map(c => ({x: c[0], y: c[1]}));
    const geom = new Polygon(new LinearRing(coordinates));
    return geom;
}