import _ from 'lodash';
import { Geometry, Point, MultiPoint, LineString, ICoordinate, MultiLineString, Polygon, LinearRing, MultiPolygon, GeometryCollection, IEnvelope, Envelope, IFeature } from "ginkgoch-geom";
import { GeoUtils, Constants } from "./GeoUtils";
import { Projection, Srs } from '../layers';

export interface ViewportInfo {
    lat: number, lng: number, zoom: number
}

export class ViewportUtils {
    public static getInitViewport(envelope: IEnvelope, screenWidth: number, screenHeight: number, envelopeSrs?: string, scales?: number[], dpi?: number): ViewportInfo {
        if (envelopeSrs === undefined) {
            let envelopeWidth = Math.abs(envelope.maxx - envelope.minx);
            let envelopeHeight = Math.abs(envelope.maxy - envelope.miny);
            if (envelopeWidth <= 360 && envelopeHeight <= 360) {
                envelopeSrs = 'WGS84';
            } 
            else {
                envelopeSrs = 'EPSG:3857';
            }
        }

        if (scales === undefined) {
            scales = Constants.DEFAULT_SCALES;
        }

        let projection = new Projection(envelopeSrs, 'WGS84');

        let scale = GeoUtils.scale(envelope, projection.from.unit, {width: screenWidth, height: screenHeight}, dpi);
        let zoom = GeoUtils.scaleLevel(scale, scales);

        let center: ICoordinate = new Point((envelope.minx + envelope.maxx) * .5, (envelope.miny + envelope.maxy) * .5);
        if (['WGS84', 'EPSG4326'].every(s => s !== envelopeSrs)) {
            center = projection.forward(center);
        }

        return { lng: center.x, lat: center.y, zoom };
    }

    public static adjustEnvelopeToMatchScreenSize(envelope: IEnvelope, screenWidth: number, screenHeight: number, marginPercentage: number = 0): Envelope {
        let [ex, ey] = [Math.abs(envelope.maxx - envelope.minx), Math.abs(envelope.maxy - envelope.miny)];
        let [rx, ry] = [ex / screenWidth, ey / screenHeight];
        let r = Math.max(rx, ry);
        let [cx, cy] = [(envelope.minx + envelope.maxx) * 0.5, (envelope.miny + envelope.maxy) * .5];

        let newMinX = cx - r * screenWidth * .5;
        let newMaxX = cx + r * screenWidth * .5;
        let newMinY = cy - r * screenHeight * .5;
        let newMaxY = cy + r * screenHeight * .5;

        if (marginPercentage !== 0) {
            let marginSizeX = (newMaxX - newMinX) * marginPercentage * .005;
            let marginSizeY = (newMaxY - newMinY) * marginPercentage * .005;
            newMinX -= marginSizeX;
            newMaxX += marginSizeX;
            newMinY -= marginSizeY;
            newMaxY += marginSizeY;
        }

        return new Envelope(newMinX, newMinY, newMaxX, newMaxY);
    }

    public static compressFeatures(features: IFeature[], featureSrs: string, scale: number, tolerance: number = 1) {
        const unit = GeoUtils.unit(featureSrs);
        const resolution = GeoUtils.resolution(scale, unit);
        
        const compressed = new Array<IFeature>();
        const pointFeatures = new Array<IFeature>();
        for (let feature of features) {
            let geom = feature.geometry
            if (geom instanceof Point) {
                pointFeatures.push(feature);
            } else {
                const compressedGeom = this._compressGeometry(geom, resolution, tolerance);
                feature.geometry = compressedGeom;
                compressed.push(feature);
            }
        }

        if (pointFeatures.length > 2) {
            const compressedPointFeatures = this._compressArbitraryCoordinatedObjects(pointFeatures, f => <Point>f.geometry, resolution, tolerance);
            compressed.push(...compressedPointFeatures);
        }

        return compressed;
    }

    public static compressFeature(feature: IFeature, featureSrs: string, scale: number, tolerance: number = 1) {
        if (_.isEmpty(feature.geometry)) {
            return feature;
        }

        feature.geometry = this.compressGeometry(feature.geometry, featureSrs, scale, tolerance);
        return feature;
    }

    public static compressGeometries(geometries: Geometry[], geomSrs: string, scale: number, tolerance: number = 1) {
        const unit = GeoUtils.unit(geomSrs);
        const resolution = GeoUtils.resolution(scale, unit);
        
        const compressed = new Array<Geometry>();
        const pointsBuffer = new MultiPoint();
        for (let geom of geometries) {
            if (geom instanceof Point) {
                pointsBuffer._geometries.push(geom);
            } else {
                const compressedGeom = this._compressGeometry(geom, resolution, tolerance);
                compressed.push(compressedGeom);
            }
        }

        if (pointsBuffer._geometries.length > 2) {
            this._compressMultiPoint(pointsBuffer, resolution, tolerance);
            compressed.push(...pointsBuffer._geometries);
        }

        return compressed;
    }

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
        } else if (geom instanceof MultiPoint) {
            this._compressMultiPoint(geom, resolution, tolerance);
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
        geom.internalRings = geom.internalRings.map(r => {
            this._compressLinearRing(r, resolution, tolerance);
            return r;
        }).filter(r => r._coordinates.length >= 4);
    }

    private static _compressLinearRing(geom: LinearRing, resolution: number, tolerance: number) {
        let coordinates = geom._coordinates;
        coordinates = this._compressOrderedCoordinates(coordinates, resolution, tolerance);
        geom._coordinates = coordinates;
    }

    private static _compressMultiLineString(geom: MultiLineString, resolution: number, tolerance: number) {
        for (let i = 0; i < geom.children.length; i++) {
            this._compressLineString(geom.children[i], resolution, tolerance);
        }
    }

    private static _compressLineString(geom: LineString, resolution: number, tolerance: number) {
        let coordinates = geom._coordinates;
        coordinates = this._compressOrderedCoordinates(coordinates, resolution, tolerance);
        geom._coordinates = coordinates;
    }

    private static _compressMultiPoint(geom: MultiPoint, resolution: number, tolerance: number) {
        if (geom._geometries.length === 0) {
            return;
        }

        const compressed = this._compressArbitraryCoordinates(geom._geometries, resolution, tolerance);
        geom._geometries = compressed;
    }

    private static _compressOrderedCoordinates(coordinates: ICoordinate[], resolution: number, tolerance: number) {
        let previous = coordinates[0];
        let compressed = [previous];
        for (let i = 1; i < coordinates.length - 1; i++) {
            const current = coordinates[i];
            const suppressed = this._shouldSuppress(previous, current, resolution, tolerance);
            if (!suppressed) {
                compressed.push(current);
                previous = current;
            }
        }

        compressed.push(coordinates[coordinates.length - 1]);

        return compressed;
    }

    private static _compressArbitraryCoordinatedObjects<T>(objects: T[], getCoordinate: (obj: T) => ICoordinate, resolution: number, tolerance: number) {
        const compressor = new CoordinateCompressor<T>(resolution, tolerance, getCoordinate);
        compressor.push(...objects);
        return compressor.getCompressed();
    }

    private static _compressArbitraryCoordinates<T extends ICoordinate>(coordinates: T[], resolution: number, tolerance: number) {
        const compressed = this._compressArbitraryCoordinatedObjects(coordinates, c => c, resolution, tolerance);
        return compressed;
    }

    private static _shouldSuppress(c1: ICoordinate, c2: ICoordinate, resolution: number, tolerance: number) {
        return (Math.abs(c1.x - c2.x) / resolution) < tolerance && (Math.abs(c1.y - c2.y) / resolution) < tolerance;
    }
}

class CoordinateCompressor<T> {
    tolerance: number;
    resolution: number;
    matrix: Map<number, Map<number, any>>;
    toCoordinateMapper: (n: T) => ICoordinate | undefined;


    constructor(resolution: number, tolerance: number, toCoordinateMapper: (n: T) => ICoordinate | undefined) {
        this.resolution = resolution;
        this.tolerance = tolerance;
        this.matrix = new Map<number, Map<number, T>>();
        this.toCoordinateMapper = toCoordinateMapper;
    }

    push(...objects: T[]) {
        if (this.tolerance < 1) {
            this.tolerance = 1;
        }

        let res = this.resolution * this.tolerance;
        for (let obj of objects) {
            let c = this.toCoordinateMapper(obj);
            if (c === undefined) {
                continue;
            }

            let sx = Math.trunc(c.x / res);
            let sy = Math.trunc(c.y / res);
            
            if (!this.matrix.has(sx)) {
                this.matrix.set(sx, new Map<number, T>());
            }

            const currentCol = this.matrix.get(sx)!;
            if (!currentCol.has(sy)) {
                currentCol.set(sy, obj);
            }
        }
    }

    getCompressed() {
        const compressed = new Array<T>();
        this.matrix.forEach(cs => {
            cs.forEach(v => {
                compressed.push(v);
            });
        });

        return compressed;
    }
}