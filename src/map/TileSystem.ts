import { Unit, Constants, GeoUtils } from "../shared";
import { Envelope } from "ginkgoch-geom";

export type TileOrigin = 'upperLeft' | 'lowerLeft' | 'upperRight' | 'lowerRight';

export class TileSystem {
    constructor(public tileWidth = 256, public tileHeight = 256,
        public unit = Unit.meter,
        public scales: Array<number> = Constants.DEFAULT_SCALES,
        public origin: TileOrigin = "upperLeft") { }

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