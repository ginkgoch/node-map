import { TileOrigin, GKMap, TileSystem } from ".";

export class XYZMap extends GKMap {
    constructor(width?: number, height?: number, srs?: string, scales?: Array<number>, public origin: TileOrigin = 'upperLeft') {
        super(width, height, srs, scales);
    }

    public async xyz(x: number = 0, y: number = 0, z: number = 0) {
        const tileSystem = new TileSystem(this.width, this.height, this.srs.unit, this.scales, this.origin);
        const envelope = tileSystem.envelope(z, x, y);
        const image = await this.image(envelope);
        return image;
    }
}