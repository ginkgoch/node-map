import * as render from '../../src/render'

const defaultEnvelope = { minx: -180, maxx: 180, miny: -90, maxy: 90 };

describe('Render', () => {
    it('measureText', () => {
        const image = new render.Image();
        const canvas = new render.Render(image, defaultEnvelope);
        const size = canvas.measureText('Hello world');
        
        expect(size.width).not.toBe(0);
        expect(size.height).not.toBe(0);
    });
});