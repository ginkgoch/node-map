import { ICoordinate, IEnvelope, Geometry, LinearRing, Polygon } from "ginkgoch-geom";
import proj4 from 'proj4';
import _ from "lodash";
import { Unit, GeoUtils } from "../shared";

/**
 * This class represents the SRS info (spatial reference system).
 */
export class Srs {
    private _projection?: string;
    private _unit: Unit = Unit.unknown;

    /**
     * Constructs a SRS info instance.
     * @param {string} projection The projection string; can be either proj4, EPSG name or WKT. 
     */
    constructor(projection?: string) {
        this.projection = projection;
    }

    /**
     * Gets the unit of SRS.
     */
    get unit() {
        return this._unit;
    }

    /**
     * A shortcut property to get the projection string; can be either proj4, EPSG name or WKT. 
     */
    get projection() {
        return this._projection;
    }

    /**
     * Sets the projection string; can be either proj4, EPSG name or WKT.
     */
    set projection(projection: string | undefined) {
        this._projection = projection;
        if (this._projection) {
            this._unit = GeoUtils.unit(this._projection);
        }
    }

    /**
     * Converts this SRS instance into a JSON format data.
     * @returns {any} A JSON format data of this SRS.
     */
    toJSON() {
        return {
            projection: this._projection,
            unit: this._unit
        };
    }

    /**
     * Parses the JSON format data into a SRS instance. If the data doesn't match the SRS schema, it throws exception.
     * @param json 
     */
    static parseJSON(json: any) {
        return new Srs(json.projection);
    }
}

/**
 * This class represents the projection that is used to apply to a feature source.
 * It maintains source and target SRS which means an internal projection that a feature source is; 
 * and an external projection that the internal features will be converted to. 
 */
export class Projection {
    _from: Srs;
    _to: Srs;
    _invalid = false;
    _converter?: proj4.Converter;

    /**
     * Constructs a Projection instance.
     * @param {string} from The from SRS. Optional.
     * @param {string} to The target SRS. Optional.
     */
    constructor(from?: string, to?: string) {
        this._from = new Srs(from);
        this._to = new Srs(to);
    }

    /**
     * Converts this projection to JSON format data.
     * @returns {any} The JSON format data of this projection.
     */
    toJSON() {
        return {
            from: this._from.toJSON(),
            to: this._to.toJSON()
        };
    }

    /**
     * Parses a JSON format data to a projection instance. 
     * The JSON data must matches the projection schema, otherwise, it throws exception.
     * @param {any} json The JSON format data.
     * @returns A projection instance. 
     */
    static parseJSON(json: any): Projection {
        return new Projection(json.from.projection, json.to.projection);
    }

    //#region properties
    /**
     * The from SRS of this projection.
     */
    get from(): Srs {
        return this._from
    }

    /**
     * Sets the from SRS of this projection.
     */
    set from(fromProjection: Srs) {
        if (this._from !== fromProjection) {
            this._from = fromProjection;
            this._invalid = true;
        }
    }

    /**
     * Gets the target SRS of this projection.
     */
    get to(): Srs {
        return this._to
    }

    /**
     * @projection {Srs} Sets the target SRS of this projection.
     */
    set to(toProjection: Srs) {
        if (this._to !== toProjection) {
            this._to = toProjection;
            this._invalid = true;
        }
    }
    //#endregion

    //#region forward
    /**
     * Converts the coordinate, envelope or geometry from source SRS to target SRS.
     * @param {ICoordinate|IEnvelope|Geometry} geom The geometry to convert from source to target direction.
     * @returns {ICoordinate|IEnvelope|Geometry} The converted geometry in target SRS.
     */
    forward(coordinate: ICoordinate): ICoordinate
    forward(coordinate: IEnvelope): IEnvelope
    forward(coordinate: Geometry): Geometry
    forward(geom: ICoordinate | IEnvelope | Geometry): ICoordinate | IEnvelope | Geometry {
        if (geom instanceof Geometry) {
            return this._forwardGeometry(geom);
        } else if (Projection._isInstanceOfICoordinate(geom)) {
            return this._forwardCoordinate(geom as ICoordinate);
        } else {
            return this._forwardEnvelope(geom as IEnvelope);
        }
    }

    get isValid(): boolean {
        return this.from.projection !== undefined && this.to.projection !== undefined && this.from.projection !== this.to.projection;
    }

    private _forwardCoordinate(coordinate: ICoordinate) {
        return this._transform(coordinate, () => {
            return (<proj4.Converter>this._converter).forward(coordinate);
        });
    }

    private _forwardGeometry(geom: Geometry) {
        return geom.clone(c => {
            return this._forwardCoordinate(c);
        });
    }

    private _forwardEnvelope(envelope: IEnvelope) {
        const segmentCount = 4;
        const polygon = Projection._segmentEnvelope(envelope, segmentCount);
        const projectedPolygon = this._forwardGeometry(polygon);
        return projectedPolygon.envelope();
    }
    //#endregion

    //#region inverse
    /**
     * Converts coordinate, geometry or envelope from target SRS to source SRS.
     * @param {ICoordinate|IEnvelope|Geometry} geom The geometry to convert from target to source direction.
     * @returns {ICoordinate|IEnvelope|Geometry} The converted geometry in source SRS.
     */
    inverse(coordinate: ICoordinate): ICoordinate
    inverse(coordinate: IEnvelope): IEnvelope
    inverse(coordinate: Geometry): Geometry
    inverse(geom: ICoordinate | IEnvelope | Geometry): ICoordinate | IEnvelope | Geometry {
        if (geom instanceof Geometry) {
            return this._inverseGeometry(geom);
        } else if (Projection._isInstanceOfICoordinate(geom)) {
            return this._inverseCoordinate(geom as ICoordinate);
        } else {
            return this._inverseEnvelope(geom as IEnvelope);
        }
    }

    private _inverseCoordinate(coordinate: ICoordinate) {
        return this._transform(coordinate, () => {
            return this._converter!.inverse(coordinate);
        });
    }

    private _inverseGeometry(geom: Geometry) {
        return geom.clone(c => {
            return this._inverseCoordinate(c);
        });
    }

    private _inverseEnvelope(envelope: IEnvelope) {
        const segmentCount = 4;
        const polygon = Projection._segmentEnvelope(envelope, segmentCount);
        const projectedPolygon = this._inverseGeometry(polygon);
        return projectedPolygon.envelope();
    }
    //#endregion

    //#region private
    private _transform(coordinate: ICoordinate, project: () => ICoordinate): ICoordinate {
        if (this._from.projection === undefined || this._to.projection === undefined) {
            return coordinate;
        }

        if (this._converter === undefined || this._invalid) {
            this._converter = proj4(this._from.projection, this._to.projection);
            this._invalid = false;
        }

        return project();
    }

    private static _isInstanceOfICoordinate(obj: any) {
        return _.every(['x', 'y'], s => s in obj);
    }

    private static _segmentEnvelope(envelope: IEnvelope, segmentCount: number) {
        const distanceSegX = Math.abs(envelope.maxx - envelope.minx) / (segmentCount + 1);
        const distanceSegY = Math.abs(envelope.maxy - envelope.miny) / (segmentCount + 1);
        const coordinates = Array<ICoordinate>();
        for (let i = 0; i < segmentCount + 1; i++) {
            coordinates.push({ x: envelope.minx + i * distanceSegX, y: envelope.maxy });
        }

        for (let i = 0; i < segmentCount + 1; i++) {
            coordinates.push({ x: envelope.maxx, y: envelope.maxy - i * distanceSegY });
        }

        for (let i = 0; i < segmentCount + 1; i++) {
            coordinates.push({ x: envelope.maxx - i * distanceSegX, y: envelope.miny });
        }

        for (let i = 0; i < segmentCount + 1; i++) {
            coordinates.push({ x: envelope.minx, y: envelope.miny + i * distanceSegY });
        }

        coordinates.push({ x: envelope.minx, y: envelope.maxy });

        const polygon = new Polygon(new LinearRing(coordinates));
        return polygon;
    }
    //#endregion
}