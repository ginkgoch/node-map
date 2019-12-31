import { ICoordinate, IEnvelope } from "ginkgoch-geom";

/**
 * This is an internal class that represents a set of commonly used utilities during the rendering.
 */
export class RenderUtils {
    /**
     * Project a world coordinate into a viewport with pixel unit.
     * @param {ICoordinate} coordinate The world coordinate to convert.
     * @param {IEnvelope} envelope The world envelope that is displayed on the viewport.
     * @param {number} resolutionX The horizontal resolution (world_width / screen_width).
     * @param resolutionY The vertical resolution (world_height / screen_height).
     */
    static toViewportCoordinate(coordinate: ICoordinate, envelope: IEnvelope, resolutionX: number, resolutionY: number): ICoordinate {
        const x = (coordinate.x - envelope.minx) / resolutionX;
        const y = (envelope.maxy - coordinate.y) / resolutionY;
        return { x, y };
    }

    /**
     * Compress screen coordinates. 
     * @param {ICoordinate[]} coordinates The screen coordinates to be compressed.
     * @param {number} tolerance Any continuous coordinates' distance is less than this tolerance, will be merged as one.
     * @returns {ICoordinate[]} The compressed screen coordinates.
     */
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

    /**
     * A pure math calculation of linear distance of two coordinates.
     * @param {ICoordinate} c1 The from coordinate.
     * @param {ICoordinate} c2 The to coordinate.
     * @returns {number} The distance.
     */
    static distance(c1: ICoordinate, c2: ICoordinate) {
        let dx = c1.x - c2.x;
        let dy = c1.y - c2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * A pure math calculation of angle of two coordinates.
     * @param {ICoordinate} c1 The from coordinate.
     * @param {ICoordinate} c2 The to coordinate.
     * @returns {number} The angle.
     */
    static angle(c1: ICoordinate, c2: ICoordinate) {
        return Math.atan2(c2.y - c1.y, c2.x - c1.x);
    }
}