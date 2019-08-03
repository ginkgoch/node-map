import _ from 'lodash';
import assert from 'assert';
import { IFeature, Geometry, Point, LineString, ICoordinate, GeometryCollection, MultiPoint, GeometryCollectionBase, MultiLineString, MultiPolygon, Polygon, LinearRing, Envelope, IEnvelope } from "ginkgoch-geom";
import { Canvas, CanvasRenderingContext2D } from 'canvas';
import { Image, Size, RenderUtils } from ".";

export class Render {
    image: Image;
    width: number;
    height: number;
    canvas: Canvas;
    resolutionX = 0;
    resolutionY = 0;
    envelope: IEnvelope;
    antialias: "default" | "none" | "gray" | "subpixel" = 'default';
    context: CanvasRenderingContext2D;
    textBounds: Array<IEnvelope> = new Array<IEnvelope>();

    constructor(image: Image, envelope: IEnvelope) {
        assert(image.width > 0, 'Image width must greater than 0.')
        assert(image.height > 0, 'Image height must greater than 0.')

        this.image = image;
        this.envelope = envelope;
        this.width = image.width;
        this.height = image.height;
        this.resolutionX = Math.abs(envelope.maxx - envelope.minx) / this.width;
        this.resolutionY = Math.abs(envelope.maxy - envelope.miny) / this.height;

        this.canvas = new Canvas(this.width, this.height);
        this.context = this.canvas.getContext('2d');
        this.context.antialias = this.antialias;
    }

    flush() {
        this.image.buffer = this.canvas.toBuffer();
    }

    measureText(text: string, style?: any): Size {
        if (style) {
            _.extend(this.context, style);
        }

        const width = this.context.measureText(text).width;
        const height = this.context.measureText('M').width;
        return { width, height };
    }

    drawBackground(bg: any) {
        if (!bg) return;

        this.context.beginPath();
        this.context.rect(0, 0, this.width, this.height);
        this.context.fillStyle = bg;
        this.context.fill();
    }

    drawFeatures(features: IFeature[], style: any) {
        features.forEach(f => this.drawFeature(f, style));
    }

    drawFeature(feature: IFeature, style: any) {
        this.drawGeometry(feature.geometry, style);
    }

    drawGeometry(geom: Geometry, style: any) {
        if (geom instanceof Point) {
            this._drawPoint(geom, style);
        } else if (geom instanceof LineString) {
            this._drawLineString(geom, style);
        } else if (geom instanceof Polygon) {
            this._drawPolygon(geom, style);
        } else if (geom instanceof MultiPoint) {
            this._drawMultiPoint(geom, style);
        } else if (geom instanceof MultiPolygon) {
            this._drawMultiPolygon(geom, style);
        } else if (geom instanceof GeometryCollection) {
            this._drawGeometryCollection(geom, style);
        } else {
            console.log(`Unsupported geometry (type: ${geom.type}) to draw.`);
        }
    }

    //#region draw concrete geometries
    _drawPoint(geom: Point, style: any) {
        const screen = RenderUtils.toViewportCoordinate(geom, this.envelope, this.resolutionX, this.resolutionY);
        if (style.symbolType === 'rect' || style.symbolType === 'square') {
            const offset = style.radius * .5;
            const left = screen.x - offset;
            const top = screen.y - offset;
            this.context.beginPath();
            this.context.rect(left, top, style.radius, style.radius);
            this.context.closePath();
        } else {
            this.context.beginPath();
            this.context.arc(screen.x, screen.y, style.radius, 0, 2 * Math.PI, false);
            this.context.closePath();
        }

        _.extend(this.context, style);
        this.context.fill();
        this.context.stroke();
    }

    _drawLineString(geom: LineString, style: any) {
        let coordinates = geom.coordinatesFlat().map(c => {
            return RenderUtils.toViewportCoordinate(c, this.envelope, this.resolutionX, this.resolutionY);
        });

        coordinates = RenderUtils.compressViewportCoordinates(coordinates);
        if (coordinates.length <= 1) return;

        const first = coordinates.shift() as ICoordinate;
        this.context.beginPath();
        this.context.moveTo(first.x, first.y);
        coordinates.forEach(c => {
            this.context.lineTo(c.x, c.y);
        });

        _.extend(this.context, style);
        this.context.stroke();
    }

    _drawPolygon(geom: Polygon, style: any) {
        this.context.beginPath();
        this._drawRing(geom.externalRing);
        geom.internalRings.forEach(r => {
            this._drawRing(r);
        });

        _.extend(this.context, style);

        this.context.fill();
        this.context.stroke();
    }

    _drawRing(geom: LinearRing) {
        let coordinates = geom.coordinatesFlat();
        coordinates = coordinates.map(c => {
            return RenderUtils.toViewportCoordinate(c, this.envelope, this.resolutionX, this.resolutionY);
        });
        coordinates = RenderUtils.compressViewportCoordinates(coordinates);

        if (coordinates.length <= 4) return;

        const first = coordinates.shift() as ICoordinate;
        this.context.moveTo(first.x, first.y);
        coordinates.forEach(c => this.context.lineTo(c.x, c.y));
        this.context.closePath();
    }

    _drawGeometryCollection<T extends Geometry>(geom: GeometryCollectionBase<T>, style: any) {
        geom.children.forEach(g => {
            this.drawGeometry(g, style);
        })
    }

    _drawMultiPoint(geom: MultiPoint, style: any) {
        this._drawGeometryCollection(geom, style);
    }

    _drawMultiLine(geom: MultiLineString, style: any) {
        this._drawGeometryCollection(geom, style);
    }

    _drawMultiPolygon(geom: MultiPolygon, style: any) {
        this._drawGeometryCollection(geom, style);
    }
    //#endregion

    //#region draw normal text
    drawText(text: string, coordinate: ICoordinate, style: any) {
        coordinate = RenderUtils.toViewportCoordinate(coordinate, this.envelope, this.resolutionX, this.resolutionY);
        
        this._drawText(text, coordinate, style);
    }
    
    _drawText(text: string, coordinate: ICoordinate, style: any, rotation: number = 0) {
        if (text.length === 0) {
            return;
        }
        
        _.extend(this.context, style);
        const textBound = this._textBound(text, coordinate);
        if (_.some(this.textBounds, b => !Envelope.disjoined(b, textBound))) {
            return;
        }
        
        this.textBounds.push(textBound);
        this._rotate(coordinate.x, coordinate.y, rotation, (x, y) => {
            const offset = Math.abs(textBound.maxy - textBound.miny) * .5;
            if (style.strokeStyle && style.lineWidth > 0) {
                this.context.strokeText(text, coordinate.x, coordinate.y + offset);
            }
            
            this.context.fillText(text, coordinate.x, coordinate.y + offset);
        });
    }
    
    _rotate(x: number, y: number, rotation: number, action: (x: number, y: number) => void) {
        if (rotation && rotation !== 0) {
            if (rotation < 0) rotation += Math.PI;
            
            this.context.save();
            this.context.translate(x, y);
            this.context.rotate(rotation);
            
            action && action(0, 0);
            
            this.context.restore();
            
        } else {
            action && action(x, y);
        }
    }
    
    _textBound(text: string, coordinate: ICoordinate) {
        const size = this.measureText(text);
        const minx = coordinate.x;
        const maxx = coordinate.x + size.width;
        const maxy = coordinate.y;
        const miny = coordinate.y - size.height;
        return new Envelope(minx, miny, maxx, maxy);
    }
    //#endregion

    drawTextOnLine(text: string, geom: LineString, style: any) {
        if (text.length === 0) return;

        let coordinates = geom.coordinatesFlat();
        if (coordinates.length === 0) {
            return;
        }

        _.extend(this.context, style);
        const textWidth = this.measureText(text, style).width;
        coordinates = coordinates.map(c => {
            return RenderUtils.toViewportCoordinate(c, this.envelope, this.resolutionX, this.resolutionY);
        });

        let previous = coordinates.shift() as ICoordinate;
        while (coordinates.length > 0) {
            const current = coordinates.shift() as ICoordinate;
            const distance = RenderUtils.distance(current, previous);
            if (distance > textWidth) {
                const x = (previous.x + current.x) * .5;
                const y = (previous.y + current.y) * .5;
                const position = { x, y };
                const rotation = RenderUtils.angle(current, previous);
                this._drawText(text, position, style, rotation);

                return;
            }

            previous = current;
        }
    }
}