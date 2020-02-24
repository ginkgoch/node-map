import fs from 'fs';
import { FeatureCollection, ViewportUtils, Constants, MultiPoint, Point, IEnvelope, Feature } from "../../src";

describe('ViewportUtils', () => {
    it('compress', () => {
        let jsonContent = fs.readFileSync('./tests/data/shared/chn-shanxi-tongchuan.json').toString();
        let json = JSON.parse(jsonContent);
        let features = FeatureCollection.create(json);
        for (let i = 0; i < features.features.length; i++) {
            ViewportUtils.compressGeometry(features.features[i].geometry, 'EPSG:900913', Constants.DEFAULT_SCALES[4]);
        }

        let newJSONContent = JSON.stringify(features.toJSON());
        expect(newJSONContent.length).toBeLessThan(jsonContent.length);
    });

    it('adjustEnvelope', () => {
        let envelope = { minx: -180, miny: -90, maxx: 180, maxy: 90 };
        let envelopeNew = ViewportUtils.adjustEnvelopeToMatchScreenSize(envelope, 256, 256);
        expect(envelopeNew).toEqual({ minx: -180, miny: -180, maxx: 180, maxy: 180 });

        envelopeNew = ViewportUtils.adjustEnvelopeToMatchScreenSize(envelope, 256, 256, 10);
        expect(envelopeNew).toEqual({ minx: -198, miny: -198, maxx: 198, maxy: 198 });
    });

    it('compress - multi points', () => {
        const envelope = { minx: -180, miny: -90, maxx: 180, maxy: 90 };
        const multiPoint = getMultiPoint(1000, 3, envelope);
        ViewportUtils.compressGeometry(multiPoint, 'EPSG:4326', Constants.DEFAULT_SCALES[0], 2);
        expect(multiPoint.children.length).toBe(381);
    });

    it('compress - features', () => {
        const envelope = { minx: -180, miny: -90, maxx: 180, maxy: 90 };
        const multiPoint = getMultiPoint(1000, 3, envelope);
        const features = multiPoint.children.map(p => new Feature(p));
        const compressed = ViewportUtils.compressFeatures(features, 'EPSG:4326', Constants.DEFAULT_SCALES[0], 2);
        expect(compressed.length).toBe(381);
    });

    it('get viewport info', () => {
        let envelope = { minx: -180, miny: -30, maxx: 0, maxy: 70 };
        let viewport = ViewportUtils.getInitViewport(envelope, 400, 300);
        expect(viewport).toEqual({ lng: -90, lat: 20, zoom: 2 });

        envelope = { "minx": 12992097.668566922, "miny": 2355845.0565018356, "maxx": 13593053.228647832, "maxy": 2953858.2157336227 };
        viewport = ViewportUtils.getInitViewport(envelope, 400, 300);
        expect(viewport).toEqual({ lng: 119.40923690795911, lat: 23.188674553528717, zoom: 6 });
    });
});

function getMultiPoint(colCount: number, rowCount: number, envelope: IEnvelope) {
    const multiPoint = new MultiPoint();
    const worldWidth = envelope.maxx - envelope.minx;
    const worldHeight = envelope.maxy - envelope.miny;
    const colWidth = worldWidth / colCount;
    const rowHeight = worldHeight / rowCount;

    for (let i = 0; i < colCount; i++) {
        const x = envelope.minx + i * colWidth;

        for (let j = 0; j < rowCount; j++) {
            const y = envelope.maxy - j * rowHeight;
            multiPoint._geometries.push(new Point(x, y));
        }
    }

    return multiPoint;
}