import fs from 'fs';
import { GeoUtils, Unit } from "..";

describe('GeoUtils', () => {
    it('unit', () => {
        let unit = GeoUtils.unit('WGS84');
        expect(unit).toEqual(Unit.degrees);

        unit = GeoUtils.unit('EPSG:3857');
        expect(unit).toEqual(Unit.meters);

        unit = GeoUtils.unit('+proj=lcc +lat_1=40.03333333333333 +lat_2=38.73333333333333 +lat_0=38 +lon_0=-82.5 +x_0=600000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs');
        expect(unit).toEqual(Unit.feet);
    });

    it('unit from file', () => {
        let content = fs.readFileSync('./tests/data/map/states.prj').toString('utf-8').trim();
        const unit = GeoUtils.unit(content);
        expect(unit).toEqual(Unit.degrees);
    });

    it('level', () => {
        let level = GeoUtils.scaleLevel(1e10);
        expect(level).toBe(0);

        level = GeoUtils.scaleLevel(9044600);
        expect(level).toBe(6);
    });
});