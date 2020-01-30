import _ from "lodash";
import { Feature, Point } from "ginkgoch-geom";
import { MemoryFeatureSource, ValueStyle, Render } from "..";
import { Field, FeatureLayer } from "../../src/layers";
import { PointStyle } from "../../src/styles";
import TestUtils from "../shared/TestUtils";

const compareImage = TestUtils.compareImageFunc(name => './tests/data/styles/' + name);

describe('ValueStyle', () => {
    it('draw - 1', async () => {
        const source = new MemoryFeatureSource()
        source.push(new Feature(new Point(-90, 45), new Map([['type', '1']])));
        source.push(new Feature(new Point(-90, -45), new Map([['type', '2']])));
        source.push(new Feature(new Point(90, 45), new Map([['type', '3']])));
        source.push(new Feature(new Point(90, -45), new Map([['type', '4']])));
        source.pushField(new Field('type', 'char', 40));

        const style = new ValueStyle('type', [
            { value: '1', style: new PointStyle('red') },
            { value: '2', style: new PointStyle('blue') },
            { value: '3', style: new PointStyle('green') },
            { value: '4', style: new PointStyle('yellow') }
        ]);

        const layer = new FeatureLayer(source);
        layer.styles.push(style);

        await layer.open();
        const canvas = Render.create(256, 256, { minx: -180, miny: -90, maxx: 180, maxy: 90 });
        await layer.draw(canvas);
        canvas.flush();

        compareImage(canvas.image, 'valueStyle-1.png');
    });

    it('draw - 2', async () => {
        let size = 40;
        const envelope = { minx: -180, miny: -90, maxx: 180, maxy: 90 }

        let xStart = envelope.minx + size * .5 + 12;
        let x = xStart;
        let y = envelope.maxy - size * .5;
        let index = 0;
        let features = new Array<Feature>();
        while (y > envelope.miny + size * .5) {
            while (x < envelope.maxx - size * .5) {
                features.push(new Feature(new Point(x, y), new Map([['type', index.toString()]])));
                x += size;
                index++;
            }

            y -= size;
            x = xStart;
        }

        const source = new MemoryFeatureSource();
        features.forEach(async (f) => {
            await source.push(f);
        });

        source.pushField(new Field('type', 'char', 40));
        const style = ValueStyle.auto('point', 'type', features.map(f => f.properties.get('type')),
            '#ff0000', '#0000ff', '#000000');

        const layer = new FeatureLayer(source);
        layer.styles.push(style);

        await layer.open();
        const canvas = Render.create(256, 256, envelope);
        await layer.draw(canvas);
        canvas.flush();

        compareImage(canvas.image, 'valueStyle-2.png');
    });

    it('json', () => {
        const values = ['1', '2', '3', '4'];
        const style = ValueStyle.auto('point', 'type', values, '#ff0000', '#0000ff', '#000000');
        const expectedJSON = {"visible":true,"type":"value-style","name":"Value Style","maximumScale":10000000000,"minimumScale":0,"items":[{"value":"1","style":{"visible":true,"type":"point-style","name":"value = 1","maximumScale":10000000000,"minimumScale":0,"symbol":"default","fillStyle":"#ff0000","strokeStyle":"#000000","lineWidth":1,"radius":12}},{"value":"2","style":{"visible":true,"type":"point-style","name":"value = 2","maximumScale":10000000000,"minimumScale":0,"symbol":"default","fillStyle":"#aaff00","strokeStyle":"#000000","lineWidth":1,"radius":12}},{"value":"3","style":{"visible":true,"type":"point-style","name":"value = 3","maximumScale":10000000000,"minimumScale":0,"symbol":"default","fillStyle":"#00ffaa","strokeStyle":"#000000","lineWidth":1,"radius":12}},{"value":"4","style":{"visible":true,"type":"point-style","name":"value = 4","maximumScale":10000000000,"minimumScale":0,"symbol":"default","fillStyle":"#0000ff","strokeStyle":"#000000","lineWidth":1,"radius":12}}],"field":"type"};

        let json = _.omit(style.toJSON(), 'id');
        json.items = (<any[]>json.items).map(i => _.omit(i, 'style.id'));

        TestUtils.compareOrLog(json, expectedJSON, false, false);
    });

    it('props', () => {
        const values = ['1', '2', '3', '4'];
        const style = ValueStyle.auto('point', 'type', values, '#ff0000', '#0000ff', '#000000');
        expect(style.props()).toEqual({});
    });
});