import { RenderUtils } from "..";

describe('RenderUtils', () => {
    it('compressViewportCoordinates', () => {
        const coords = [
            { x: 1.0001, y: 50.0001 },
            { x: 1.0002, y: 50.0001 },
            { x: 1.0003, y: 50.0001 },
            { x: 1.0004, y: 50.0001 },
            { x: 1.0005, y: 50.0001 },
            { x: 1.0006, y: 50.0001 },
            { x: 1.0007, y: 50.0001 },
            { x: 1.0008, y: 50.0001 },
            { x: 1.0009, y: 50.0001 },
            { x: 3, y: 50.0001 }
        ];

        const result = RenderUtils.compressViewportCoordinates(coords);
        expect(result.length).toBe(2);
    });
});