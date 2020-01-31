import { Geometry, Point, MultiPoint, LineString, ICoordinate, MultiLineString, Polygon, LinearRing, MultiPolygon, GeometryCollection } from "ginkgoch-geom";
import { GeoUtils } from "./GeoUtils";

export class ViewportUtils {
    public static compressGeometry<T extends Geometry>(geom: T, geomSrs: string, scale: number, tolerance: number = 1): T {
        const unit = GeoUtils.unit(geomSrs);
        const resolution = GeoUtils.resolution(scale, unit);
        this._compressGeometry(geom, resolution, tolerance);
        return geom;
    }

    private static _compressGeometry(geom: Geometry, resolution: number, tolerance: number) {
        if (geom instanceof LineString) {
            this._compressLineString(geom, resolution, tolerance);
        } else if (geom instanceof MultiLineString) {
            this._compressMultiLineString(geom, resolution, tolerance);
        } else if (geom instanceof Polygon) {
            this._compressPolygon(geom, resolution, tolerance);
        } else if (geom instanceof MultiPolygon) {
            this._compressMultiPolygon(geom, resolution, tolerance);
        } else if (geom instanceof GeometryCollection) {
            this._compressGeomCollection(geom, resolution, tolerance);
        }

        return geom;
    }

    private static _compressGeomCollection(geom: GeometryCollection, resolution: number, tolerance: number) {
        for (let i = 0; i < geom.children.length; i++) {
            this._compressGeometry(geom.children[i], resolution, tolerance);
        }
    }

    private static _compressMultiPolygon(geom: MultiPolygon, resolution: number, tolerance: number) {
        for (let i = 0; i < geom.children.length; i++) {
            this._compressPolygon(geom.children[i], resolution, tolerance);
        }
    }

    private static _compressPolygon(geom: Polygon, resolution: number, tolerance: number) {
        this._compressLinearRing(geom.externalRing, resolution, tolerance);
        for (let i = 0; i < geom.internalRings.length; i++) {
            this._compressLinearRing(geom.internalRings[i], resolution, tolerance);
        }
    }

    private static _compressLinearRing(geom: LinearRing, resolution: number, tolerance: number) {
        let coordinates = geom._coordinates;
        coordinates = this._compressCoordinates(coordinates, resolution, tolerance);
        geom._coordinates = coordinates;
    }

    private static _compressMultiLineString(geom: MultiLineString, resolution: number, tolerance: number) {
        for (let i = 0; i < geom.children.length; i++) {
            this._compressLineString(geom.children[i], resolution, tolerance);
        }
    }

    private static _compressLineString(geom: LineString, resolution: number, tolerance: number) {
        let coordinates = geom._coordinates;
        coordinates = this._compressCoordinates(coordinates, resolution, tolerance);
        geom._coordinates = coordinates;
    }

    private static _shouldSuppress(c1: ICoordinate, c2: ICoordinate, resolution: number, tolerance: number) {
        return Math.abs(c1.x - c2.x) / resolution > tolerance || Math.abs(c1.y - c2.y) / resolution > tolerance;
    }

    private static _compressCoordinates(coordinates: ICoordinate[], resolution: number, tolerance: number) {
        let previous = coordinates[0];
        let compressed = [previous];
        for (let i = 1; i < coordinates.length - 1; i++) {
            const current = coordinates[i];
            const suppressed = this._shouldSuppress(previous, current, resolution, tolerance);
            if (!suppressed) {
                compressed.push(coordinates[i]);
                previous = current;
            }
        }

        compressed.push(coordinates[coordinates.length - 1]);

        return compressed;
    }
}