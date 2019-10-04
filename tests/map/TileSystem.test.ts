import { TileSystem } from "../../src/map";

describe('TileSystem', () => {
    it('quadXYZtoTile', () => {
        const tileSystem = new TileSystem();
        let envelope = tileSystem.quadXYZtoTile(0, 0, 0);
        expect(envelope).toEqual({
            minx: -20037508.352,
            maxx: 20037508.352,
            miny: -20037508.352,
            maxy: 20037508.352
        });

        envelope = tileSystem.quadXYZtoTile(3, 8, 8);
        expect(envelope).toEqual({
            minx: 20037508.352,
            miny: -25046885.44,
            maxx: 25046885.44,
            maxy: -20037508.352
        });
    });
});