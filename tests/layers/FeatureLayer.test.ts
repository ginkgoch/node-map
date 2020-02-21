import { LineString, Feature, GeometryFactory } from "ginkgoch-geom";
import { MemoryFeatureSource, FeatureLayer, Render, LineStyle, ShapefileFeatureSource } from "..";
import TestUtils from "../shared/TestUtils";
import { FillStyle } from "../../src/styles";
import _ from "lodash";

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

    it('draw - shapefile', async () => {
        const source = new ShapefileFeatureSource('./tests/data/layers/USStates.shp');
        const layer = new FeatureLayer(source);
        layer.styles.push(new FillStyle('#886600', 'red', 2));

        await layer.open();
        const envelope = await layer.envelope();
        const render = Render.create(256, 256, envelope);
        await layer.draw(render);
        render.flush();

        compareImage(render.image, 'layer-area.png');
    });

    it('draw with index - shapefile', async () => {
        const source = new ShapefileFeatureSource('./tests/data/layers/USStates.shp');
        const layer = new FeatureLayer(source);
        layer.styles.push(new FillStyle('#886600', 'red', 2));

        await layer.open();
        const envelope = await layer.envelope();
        const render = Render.create(256, 256, envelope);
        await layer.draw(render);
        render.flush();

        compareImage(render.image, 'layer-draw-index.png');
    });

    it('json', () => {
        const layer = lineLayer();
        let json = layer.toJSON();

        json = _.omit(json, 'id');
        json.styles = (<object[]>json.styles).map(s => _.omit(s, 'id'));

        TestUtils.compareOrLog(json, {
            "type": "feature-layer", 
            "name": "Unknown",
            "visible": true,
            "source": {
                "type": "memory-feature-source", "name": "Unknown", "projection": { "from": { "unit": 'unknown' }, "to": { "unit": 'unknown' } }, "features": {
                    "id": 0, "type"
                        : "FeatureCollection", "features": [{ "id": 1, "type": "Feature", "geometry": { "type": "LineString", "coordinates": [[-100, 80], [-40, -80], [0, 20], [40, -80], [100, 80]] }, "properties": {} }]
                }, "fields"
                    : []
            }, "styles": [{ "type": "line-style", "name": "Line Style", "visible": true, "maximumScale": 10000000000, "minimumScale": 0, "strokeStyle": "#886600", "lineWidth": 4 }], "minimumScale": 0, "maximumScale": 10000000000
        }, false, false);
    });

    it('parseJson - mem', () => {
        const layer = lineLayer();
        const json = layer.toJSON();
        const newLayer = FeatureLayer.parseJSON(json);

        const s1 = JSON.stringify(json);
        const s2 = JSON.stringify(newLayer.toJSON());
        expect(s2).toEqual(s1);
    });

    it('parseJson - shp', () => {
        const source = new ShapefileFeatureSource('./tests/data/layers/USStates.shp');
        const layer = new FeatureLayer(source);

        const json = layer.toJSON();
        const newLayer = FeatureLayer.parseJSON(json);

        const s1 = JSON.stringify(json);
        const s2 = JSON.stringify(newLayer.toJSON());
        expect(s2).toEqual(s1);
    });

    it('name', () => {
        const source = new ShapefileFeatureSource('./tests/data/layers/USStates.shp');
        const layer = new FeatureLayer(source);
        expect(layer.name).toEqual('USStates');
    });

    it('find proj file', async () => {
        const source = new ShapefileFeatureSource('./tests/data/layers/latlong.shp');
        const layer = new FeatureLayer(source);
        await layer.open();

        expect((<any>source.projection.from)._unit).toEqual('degrees');
    });

    it('query - disjoint', async () => {
        const source = new ShapefileFeatureSource('./tests/data/layers/latlong.shp');
        await source.open();

        let features = await source.query('disjoint', GeometryFactory.envelopeAsPolygon({ minx: -10, miny: -10, maxx: 10, maxy: 10 }));
        expect(features.length).toBeGreaterThan(0);
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