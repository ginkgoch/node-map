import { ICoordinate, IEnvelope } from "ginkgoch-geom";

export class RenderUtils {
    static toViewportCoordinate(coordinate: ICoordinate, envelope: IEnvelope, resolutionX: number, resolutionY: number): ICoordinate {
        const x = (coordinate.x - envelope.minx) / resolutionX;
        const y = (envelope.maxy - coordinate.y) / resolutionY;
        return { x, y };
    }

    static compressViewportCoordinates(coordinates: ICoordinate[], tolerance = 1) {
        const compressed: ICoordinate[] = [];
        
        let previous = coordinates.shift();
        if (previous === undefined) {
            return compressed;
        }

        compressed.push(previous);
        let current = coordinates.shift();
        while (current !== undefined) {
            if (Math.abs(current.x - previous.x) > tolerance || Math.abs(current.y - previous.y) > tolerance) {
                compressed.push(current);
                previous = current;
            }

            current = coordinates.shift();
        }

        return compressed;
    }

    static distance(c1: ICoordinate, c2: ICoordinate) {
        let dx = c1.x - c2.x;
        let dy = c1.y - c2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static angle(c1: ICoordinate, c2: ICoordinate) {
        return Math.atan2(c2.y - c1.y, c2.x - c1.x);
    }
}