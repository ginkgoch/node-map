import { LineStyle } from "../../src/styles";
import { Feature, LineString } from "ginkgoch-geom";
import { Render } from "../../src/render";
import TestUtils from "../shared/TestUtils";

const compareImage = TestUtils.compareImageFunc(TestUtils.resolveStyleDataPath);

describe('LineStyle', () => {
    it('draw - 1', () => {
        const canvas = Render.create(64, 64);
        const style = new LineStyle('#00ff00', 6);
        const geom = gen();
        style.draw(new Feature(geom), canvas);
        canvas.flush();

        compareImage(canvas.image, 'linestyle-1.png');
    }); 
    
    it('draw - 2', () => {
        const canvas = Render.create(64, 64);
        const style1 = new LineStyle('#00ff00', 6);
        const style2 = new LineStyle('#ffffff', 2);
        const geom = gen();
        style1.draw(new Feature(geom), canvas);
        style2.draw(new Feature(geom), canvas);
        canvas.flush();

        compareImage(canvas.image, 'linestyle-2.png');
    });
});

function gen() {
    const coordinates = [[-160, 80], [-40, -80], [0, 0], [40, -80], [160, 80]].map(c => ({ x: c[0], y: c[1] }));
    return new LineString(coordinates);
}