import { GeoUtils, Unit } from "..";

describe('GeoUtils', () => {
    it('unit', () => {
        let unit = GeoUtils.unit('WGS84');
        expect(unit).toEqual(Unit.degrees);

        unit = GeoUtils.unit('EPSG:3857');
        expect(unit).toEqual(Unit.meter);

        unit = GeoUtils.unit('+proj=lcc +lat_1=40.03333333333333 +lat_2=38.73333333333333 +lat_0=38 +lon_0=-82.5 +x_0=600000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs');
        expect(unit).toEqual(Unit.feet);
    })
});