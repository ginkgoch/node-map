import _ from "lodash";
import { FillStyle, FillPattern, Render, Image } from "..";
import { Feature, Polygon, LinearRing } from "ginkgoch-geom";
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

    it('draw - 2', () => {
        const canvas = Render.create(256, 256);

        const fillPattern: FillPattern = { image: new Image('./tests/data/location.png'), repeat: 'repeat' };
        const style = new FillStyle(fillPattern, 'red', 4);
        const geom = gen();
        const feature = new Feature(geom);
        style.draw(feature, canvas);
        canvas.flush();

        compareImage(canvas.image, 'fillstyle-pattern.png');
    });

    it('json', () => {
        const style = new FillStyle('#00ff00', 'red', 4);
        const expectedJSON = {
            visible: true,
            type: 'fill-style',
            name: 'Fill Style',
            maximumScale: 10000000000,
            minimumScale: 0,
            lineWidth: 4,
            fillStyle: '#00ff00',
            strokeStyle: 'red'
        };

        let json = style.toJSON();
        json = _.omit(json, 'id');
        TestUtils.compareOrLog(json, expectedJSON, false, false);
    });

    it('props', () => {
        const style = new FillStyle('#00ff00', 'red', 4);
        expect(style.props()).toEqual({ lineWidth: 4, fillStyle: '#00ff00', strokeStyle: 'red' });
    });
});

function gen() {
    const coordinates = [[0, 80], [-160, -70], [160, -70], [0, 80]].map(c => ({ x: c[0], y: c[1] }));
    const geom = new Polygon(new LinearRing(coordinates));
    return geom;
}