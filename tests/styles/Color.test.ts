import { Colors, ColorFormat } from "../../src/styles";
import { Render } from "..";
import { Envelope, Polygon, LinearRing } from "ginkgoch-geom";
import TestUtils from "../shared/TestUtils";

describe('Colors', () => {
    it('randomColor - 1', () => {
        for (let i = 0; i < 10; i++) {
            let color = Colors.random();
            expect(color).toMatch(/^#\w{6}$/);
            expect(color.length).toBe(7);
        }
    });

    it('randomColor - 2', () => {
        for (let i = 0; i < 10; i++) {
            let color = Colors.random({
                alpha: 0.5,
                format: ColorFormat.rgba
            });
            expect(color).toMatch(/^rgba\(/);
        }
    });

    it('randomColor - 3', () => {
        for (let i = 0; i < 10; i++) {
            let color = Colors.randomHex();
            expect(color).toMatch(/^#\w{6}$/);
            expect(color.length).toBe(7);
        }
    });

    it('between - error', () => {
        function betweenColors() {
            Colors.between('#000000', '#ffffff', 1);
        }

        expect(betweenColors).toThrow(/than 1/);
    });    
    
    const compareImage = TestUtils.compareImageFunc(name => TestUtils.resolveStyleDataPath(name));
    it('between - normal - 1', () => {
        const colors = Colors.between('#000000', '#ffffff', 3);
        expect(colors.length).toBe(3);

        const image = drawColors(colors);
        compareImage(image, 'colors-1.png');
    });

    it('between - normal - 2', () => {
        const colors = Colors.between('#ff0000', '#0000ff', 20);
        expect(colors.length).toBe(20);

        const image = drawColors(colors);
        compareImage(image, 'colors-2.png');
    });

    it('between - normal - 3', () => {
        const colors = Colors.between('red', 'blue', 20);
        expect(colors.length).toBe(20);

        const image = drawColors(colors);
        compareImage(image, 'colors-between-3.png', true);
    });

    it('between - forward - 1', () => {
        const colors = Colors.forward('#ff0000', 20, 100, 'all');
        expect(colors.length).toBe(20);

        const image = drawColors(colors);
        compareImage(image, 'colors-3.png');
    });

    it('between - forward - 2', () => {
        const colors = Colors.forward('#ff0000', 20, 100);
        expect(colors.length).toBe(20);

        const image = drawColors(colors);
        compareImage(image, 'colors-4.png');
    });

    it('between - forward - 3', () => {
        const colors = Colors.forward('#ff0000', 20, 100, 'saturation');
        expect(colors.length).toBe(20);

        const image = drawColors(colors);
        compareImage(image, 'colors-5.png');
    });

    it('between - forward - 4', () => {
        const colors = Colors.forward('#ff0000', 20, 100, 'luminosity');
        expect(colors.length).toBe(20);

        const image = drawColors(colors);
        compareImage(image, 'colors-6.png');
    });

    it('between - backward - 1', () => {
        const colors = Colors.backward('#ff0000', 20, 100, 'all');
        expect(colors.length).toBe(20);

        const image = drawColors(colors);
        compareImage(image, 'colors-3-b.png');
    });

    it('between - backward - 2', () => {
        const colors = Colors.backward('#ff0000', 20, 100);
        expect(colors.length).toBe(20);

        const image = drawColors(colors);
        compareImage(image, 'colors-4-b.png');
    });

    it('between - backward - 3', () => {
        const colors = Colors.backward('#ff0000', 20, 100, 'saturation');
        expect(colors.length).toBe(20);

        const image = drawColors(colors);
        compareImage(image, 'colors-5-b.png');
    });

    it('between - backward - 4', () => {
        const colors = Colors.backward('#ff0000', 20, 100, 'luminosity');
        expect(colors.length).toBe(20);

        const image = drawColors(colors);
        compareImage(image, 'colors-6-b.png');
    });

    it('color by name', () => {
        const color = Colors.color('SLATEGRAY');
        expect(color).toEqual(Colors.SLATEGRAY);
    });

    it('color by name - lower', () => {
        const color = Colors.color('slategray');
        expect(color).toEqual(Colors.SLATEGRAY);
    });
});

function drawColors(colors: string[]) {
    const imageWidth = 512, margin = 40;
    const envelope = new Envelope(-180, -90, 180, 90);
    const resolution = envelope.width / imageWidth;
    const marginWorld = margin * resolution;
    
    const partWorldWidth = (envelope.width - marginWorld * 2) / (colors.length - 1);
    const canvas = Render.create(512, 256, envelope);

    canvas.drawBackground('#ffffff');
    for(let i = 0; i < colors.length; i++) {
        const x1 = envelope.minx + marginWorld + partWorldWidth * (i - .5);
        const y1 = envelope.maxy - marginWorld;
        const x2 = x1 + partWorldWidth;
        const y2 = envelope.miny + marginWorld;
        const polygon = new Polygon(new LinearRing([[x1, y1], [x1, y2], [x2, y2], [x2, y1], [x1, y1]].map(c => ({x: c[0], y: c[1]}))));
        canvas.drawGeometry(polygon, { fillStyle: colors[i], lineWidth: 0, radius: 14 });
    }

    canvas.flush();
    return canvas.image;
}