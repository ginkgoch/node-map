import proj4 from 'proj4';
import { Projection } from "../../src/layers/Projection";
import { Polygon } from "ginkgoch-geom";

describe('Projection', () => {
    it('forward - coordinate', () => {
        const proj = new Projection('WGS84', 'GOOGLE');
        const coordinate1 = { x: -119.7022, y: 34.4191 };
        const coordinate2 = proj.forward(coordinate1);
        expect(equalWithDigit(coordinate2.x, -13325187.950834593)).toBeTruthy();
        expect(equalWithDigit(coordinate2.y, 4085216.7046932327)).toBeTruthy();
    });
    
    it('inverse - coordinate', () => {
        const proj = new Projection('WGS84', 'GOOGLE');
        const coordinate1 = {x: -13325187.950834593, y: 4085216.7046932327};
        const coordinate2 = proj.inverse(coordinate1);
        expect(equalWithDigit(coordinate2.x, -119.7022)).toBeTruthy();
        expect(equalWithDigit(coordinate2.y, 34.4191)).toBeTruthy();
        
    });

    it('forward - envelope', () => {
        const proj = new Projection('WGS84', 'GOOGLE');
        const envelope1 = {minx: -10, miny: -10, maxx: 10, maxy: 10};
        const envelope2 = proj.forward(envelope1);
        expect(envelope2).toEqual({
            minx: -1113194.9079327357,
            miny: -1118889.9748579601,
            maxx: 1113194.9079327357,
            maxy: 1118889.9748579597 
        });
    });

    it('segmentEnvelope', () => {
        const envelope = { minx: -25, miny: -25, maxx: 25, maxy: 25 };
        const polygon = (Projection as any)._segmentEnvelope(envelope, 4) as Polygon;

        expect(polygon.externalRing.coordinates().length).toBe(21);
        expect(polygon.externalRing.coordinates()).toEqual([ 
            [ -25, 25 ],
            [ -15, 25 ],
            [ -5, 25 ],
            [ 5, 25 ],
            [ 15, 25 ],
            [ 25, 25 ],
            [ 25, 15 ],
            [ 25, 5 ],
            [ 25, -5 ],
            [ 25, -15 ],
            [ 25, -25 ],
            [ 15, -25 ],
            [ 5, -25 ],
            [ -5, -25 ],
            [ -15, -25 ],
            [ -25, -25 ],
            [ -25, -15 ],
            [ -25, -5 ],
            [ -25, 5 ],
            [ -25, 15 ],
            [ -25, 25 ] ]);
    });

    it('proj4 - unit', () => {
        let proj1 = proj4('EPSG:4326') as any;
        expect(proj1.oProj.units).toEqual('degrees');

        let proj2 = proj4('GOOGLE') as any;
        expect(proj2.oProj.units).toEqual('m');

        let proj3 = proj4('+proj=lcc +lat_1=40.03333333333333 +lat_2=38.73333333333333 +lat_0=38 +lon_0=-82.5 +x_0=600000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs') as any;
        expect(proj3.oProj.units).toEqual('us-ft');    
    });
});

function equalWithDigit(x1: number, x2: number, digit = 0.0001) {
    return Math.abs(x1 - x2) < digit;
}