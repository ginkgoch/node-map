import { Feature, Point, Polygon, LinearRing, GeometryFactory } from "ginkgoch-geom";
import { MemoryFeatureSource, Field, ValueStyle, FeatureLayer, Render } from "..";
import TestUtils from "../shared/TestUtils";
import { ClassBreakStyle } from "../../src/styles";

const compareImage = TestUtils.compareImageFunc(name => './tests/data/styles/' + name);

describe('ClassBreakStyle', () => {
    it('draw', async () => {
        let size = 16;
        const envelope = { minx: -180, miny: -90, maxx: 180, maxy: 90 }

        let features = new Array<Feature>();
        const breakIncrement = 180 / size;
        const valueIncrement = 100 / size;
        for (let i = 0; i < size; i++) {
            const top = 90 - breakIncrement * i;
            const btm = top - breakIncrement;
            const polygon = GeometryFactory.createPolygon({ minx: -180, miny: btm, maxx: 180, maxy: top });
            features.push(new Feature(polygon, new Map([['type', valueIncrement * i]])));
        }

        features = features.sort((f1, f2) => {
            return f2.properties.get('type') - f1.properties.get('type');
        });

        const source = new MemoryFeatureSource(features);

        source.pushField(new Field('type', 'char', 40));
        const style = ClassBreakStyle.auto('point', 'type', 100, 0, size, '#ff0000', '#0000ff', undefined, 0);

        const layer = new FeatureLayer(source);
        layer.styles.push(style);
        
        await layer.open();
        const canvas = Render.create(256, 256, envelope);
        await layer.draw(canvas);
        canvas.flush();

        compareImage(canvas.image, 'classBreak-1.png');
    });

    it('json', () => {
        const style = ClassBreakStyle.auto('point', 'type', 100, 0, 4, '#ff0000', '#0000ff', undefined, 0);
        const json = style.json();
        expect(JSON.stringify(json)).toEqual(`{"type":"unknown","name":"unknown","maximumScale":null,"minimumScale":0,"field":"type","classBreaks":[{"minimum":null,"maximum":25,"style":{"type":"unknown","name":"-Infinity ~ 25","maximumScale":null,"minimumScale":0,"symbol":"default","fillStyle":"#ff0000","strokeStyle":"#ff0000","lineWidth":0,"radius":12}},{"minimum":25,"maximum":50,"style":{"type":"unknown","name":"25 ~ 50","maximumScale":null,"minimumScale":0,"symbol":"default","fillStyle":"#ff0000","strokeStyle":"#ff0000","lineWidth":0,"radius":12}},{"minimum":50,"maximum":75,"style":{"type":"unknown","name":"50 ~ 75","maximumScale":null,"minimumScale":0,"symbol":"default","fillStyle":"#aaff00","strokeStyle":"#aaff00","lineWidth":0,"radius":12}},{"minimum":75,"maximum":null,"style":{"type":"unknown","name":"75 ~ Infinity","maximumScale":null,"minimumScale":0,"symbol":"default","fillStyle":"#0000ff","strokeStyle":"#0000ff","lineWidth":0,"radius":12}}]}`);
    });

    it('props', () => {
        const style = ClassBreakStyle.auto('point', 'type', 100, 0, 4, '#ff0000', '#0000ff', undefined, 0);
        const props = style.props();
        console.log(props);
    })
});