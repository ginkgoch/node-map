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
});