import fs from 'fs';
import { Point, LineString, LinearRing, Polygon, MultiPoint, MultiLineString, MultiPolygon } from 'ginkgoch-geom';
import { Image, Render } from '../../src/render';

const defaultEnvelope = { minx: -180, maxx: 180, miny: -90, maxy: 90 };

describe('Render', () => {
    it('measureText', () => {
        const image = new Image();
        const canvas = new Render(image, defaultEnvelope);
        const size = canvas.measureText('Hello world');

        expect(size.width).not.toBe(0);
        expect(size.height).not.toBe(0);
    });

    it('drawBackground', () => {
        const canvas = Render.create();
        canvas.drawBackground('#00ff00');
        canvas.flush();

        compareImage(canvas.image, 'background.png');
    });

    it('drawPoint', () => {
        const image = new Image();
        const canvas = new Render(image, defaultEnvelope);
        [
            { x: -90, y: 0 },
            { x: -90, y: 45 },
            { x: 0, y: 45 },
            { x: 90, y: 45 },
            { x: 90, y: 0 },
            { x: 90, y: -45 },
            { x: 0, y: -45 },
            { x: -90, y: -45 },
        ].map(p => new Point(p.x, p.y)).forEach(p => {
            canvas.drawGeometry(p, styleBase);
        });
        canvas.flush();
        
        compareImage(canvas.image, 'point.png');
    });

    it('drawLine', () => {

        const arr = [-180, 0, -160, 90, -130, -90, -50, 90, 0, -90, 150, 70, 180, 0];
        const line = new LineString();
        for (let i = 0; i < arr.length; i += 2) {
            line._coordinates.push({ x: arr[i], y: arr[i + 1] });
        }

        const canvas = Render.create();
        canvas.drawGeometry(line, styleBase);
        canvas.flush();

        compareImage(canvas.image, 'line.png');
    });

    it('drawPolygon', () => {
        const coordinates = [[0, 90], [90, 0], [0, -90], [-90, 0], [0, 90]].map(c => {
            return { x: c[0], y: c[1] };
        });

        const ring = new LinearRing(coordinates);
        const polygon = new Polygon(ring);

        const canvas = Render.create();
        canvas.drawGeometry(polygon, styleBase);
        canvas.flush();

        compareImage(canvas.image, 'polygon.png');
    });

    it('drawPolygon - hole', () => {
        const coordinates = [[0, 90], [90, 0], [0, -90], [-90, 0], [0, 90]].map(c => ({ x: c[0], y: c[1] }));
        const coordinates1 = [[0, 45], [-45, 0], [0, -45], [45, 0], [0, 45]].map(c => ({ x: c[0], y: c[1] }));
        const polygon = new Polygon(new LinearRing(coordinates), new LinearRing(coordinates1));

        const canvas = Render.create();
        canvas.drawGeometry(polygon, styleBase);
        canvas.flush();

        compareImage(canvas.image, 'polygon-hole.png');
    });

    it('drawMultiPoint', () => {
        const multiPoint = new MultiPoint();
        multiPoint.children.push(new Point(-90, 45));
        multiPoint.children.push(new Point(90, 45));
        multiPoint.children.push(new Point(90, -45));
        multiPoint.children.push(new Point(-90, -45));

        const canvas = Render.create();
        canvas.drawGeometry(multiPoint, styleBase);
        canvas.flush();

        compareImage(canvas.image, 'multiPoint.png');
    });

    it('drawMultiLine', () => {
        const multiLine = new MultiLineString();
        multiLine.children.push(new LineString([[-80, 0], [0, 80], [80, 0]].map(c => ({ x: c[0], y: c[1] }))));
        multiLine.children.push(new LineString([[-80, -40], [0, 40], [80, -40]].map(c => ({ x: c[0], y: c[1] }))));
        multiLine.children.push(new LineString([[-80, -80], [0, 0], [80, -80]].map(c => ({ x: c[0], y: c[1] }))));

        const canvas = Render.create();
        canvas.drawGeometry(multiLine, styleLine);
        canvas.flush();

        compareImage(canvas.image, 'multiLine.png');
    });

    it('drawMultiPolygon', () => {
        const multiPolygon = new MultiPolygon();
        multiPolygon.children.push(genPolygon(-40, 40));
        multiPolygon.children.push(genPolygon(40, 40));
        multiPolygon.children.push(genPolygon(40, -40));
        multiPolygon.children.push(genPolygon(-40, -40));

        const canvas = Render.create();
        canvas.drawGeometry(multiPolygon, styleLine);
        canvas.flush();

        compareImage(canvas.image, 'multiPolygon.png');
    });
});

const styleBase = {
    fillStyle: '#ff0000',
    strokeStyle: '#000000',
    lineWidth: 1,
    radius: 8
};

const styleLine = {
    fillStyle: '#ff0000',
    strokeStyle: '#0000ff',
    lineWidth: 4,
    radius: 8
};

function resolvePath(path: string) {
    return './tests/data/render/' + path;
}

function compareImage(image: Image, name: string, gen: boolean = false) {
    const filePath = resolvePath(name);

    if (gen) {
        fs.writeFileSync(resolvePath(name), image.buffer);
    } else {
        const expectBuff = fs.readFileSync(filePath);
        expect(image.buffer).not.toBeNull();
        expect(Buffer.compare(<Buffer>image.buffer, expectBuff)).toBe(0);
    }
}

function genPolygon(offsetX: number, offsetY: number) {
    const ring = [[-20, 20], [20, 20], [20, -20], [-20, -20], [-20, 20]].map(c => ({ x: c[0] + offsetX, y: c[1] + offsetY }));
    const polygon = new Polygon(new LinearRing(ring));
    return polygon;
}