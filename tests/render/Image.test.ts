import * as render from '..';

describe('image tests', () => {
    test('toBuffer test 1', () => {
        const image = new render.Image();
        expect(image.width).toBe(256);
        expect(image.height).toBe(256);
        expect(image.toBuffer().length).toBeGreaterThan(0);
    });

    test('toBuffer test 2', () => {
        const image = new render.Image(512, 512);
        expect(image.width).toBe(512);
        expect(image.height).toBe(512);
        expect(image.toBuffer().length).toBeGreaterThan(0);
    });

    test('toBuffer test 3', () => {
        const image = new render.Image('./tests/data/location.png');
        expect(image.width).toBe(32);
        expect(image.height).toBe(32);
        expect(image.toBuffer().length).toBeGreaterThan(0);
    });
});