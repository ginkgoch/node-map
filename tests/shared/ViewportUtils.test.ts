import fs from 'fs';
import { GeometryFactory, Feature, FeatureCollection, ViewportUtils, Constants } from "../../src";

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
        expect(envelopeNew).toEqual({minx: -180, miny: -180, maxx: 180, maxy: 180});

        envelopeNew = ViewportUtils.adjustEnvelopeToMatchScreenSize(envelope, 256, 256, 10);
        expect(envelopeNew).toEqual({minx: -198, miny: -198, maxx: 198, maxy: 198});
    });
});