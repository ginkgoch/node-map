import { Unit, Constants, GeoUtils } from "../shared";
import { Envelope } from "ginkgoch-geom";

/**
 * This type defines tile origin that are allowed for tiling system.
 */
export type TileOrigin = 'upperLeft' | 'lowerLeft' | 'upperRight' | 'lowerRight';

/**
 * This class represents the tile system which is used to generate tile matrix and split tiles under variable scale definitions.
 */
export class TileSystem {
    /**
     * Construct a tile system instance.
     * @param {number} tileWidth The tile width in pixel. Optional with default value 256 px.
     * @param {number} tileHeight The tile height in pixel. Optional with default value 256 px.
     * @param {Unit} unit The geography unit. Optional with default value `meters`. 
     * @param {Array<number>} scales The scale list to defines various zoom levels.
     * @param {TileOrigin} origin The tile origin for calculating tiles.
     */
    constructor(public tileWidth = 256, public tileHeight = 256,
        public unit = Unit.meters,
        public scales: Array<number> = Constants.DEFAULT_SCALES,
        public origin: TileOrigin = "upperLeft") { }

    /**
     * Gets tile envelope of a specific tile location (x, y, z).
     * @param {number} z The zoom level number of the tile. Starts from 0.
     * @param {number} x The column number of the tile. Starts from 0.
     * @param {number} y The row number of the tile. Starts from 0.
     */
    envelope(z: number, x: number, y: number) {
        const maximumEnvelope = GeoUtils.maximumEnvelope(this.unit, this.scales[0]);

        if (z < 0) z = 0;
        else if (z > this.scales.length - 1) z = this.scales.length - 1;

        const scale = this.scales[z];
        const resolution = GeoUtils.resolution(scale, this.unit);
        const [tileWorldWidth, tileWorldHeight] = [this.tileWidth * resolution, this.tileHeight * resolution];

        switch (this.origin) {
            case 'lowerLeft': {
                const minx = maximumEnvelope.minx + tileWorldWidth * x;
                const maxx = minx + tileWorldWidth;
                const miny = maximumEnvelope.miny + tileWorldHeight * y;
                const maxy = miny + tileWorldHeight;
                return new Envelope(minx, miny, maxx, maxy);
            }
            case "upperRight": {
                const maxx = maximumEnvelope.maxx - tileWorldWidth * x;
                const minx = maxx - tileWorldWidth;
                const maxy = maximumEnvelope.maxy - tileWorldHeight * y;
                const miny = maxy - tileWorldHeight;
                return new Envelope(minx, miny, maxx, maxy);
            }
            case 'lowerRight': {
                const maxx = maximumEnvelope.maxx - tileWorldWidth * x;
                const minx = maxx - tileWorldWidth;
                const miny = maximumEnvelope.miny + tileWorldHeight * y;
                const maxy = miny + tileWorldHeight;
                return new Envelope(minx, miny, maxx, maxy);
            }
            case 'upperLeft': 
            default: {
                const minx = maximumEnvelope.minx + tileWorldWidth * x;
                const maxx = minx + tileWorldWidth;
                const maxy = maximumEnvelope.maxy - tileWorldHeight * y;
                const miny = maxy - tileWorldHeight;
                return new Envelope(minx, miny, maxx, maxy);
            }
        }
    }

    /**
     * @deprecated This method is deprecated, please call `envelope(z: number, x: number, y: number)` instead.
     */
    quadXYZtoTile(z: number, x: number, y: number) {
        return this.envelope(z, x, y);
    }
}