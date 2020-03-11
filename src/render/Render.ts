import _ from 'lodash';
import assert from 'assert';
import { Image, Size, RenderUtils } from ".";
import { Unit } from '../shared/Unit';
import { GeoUtils } from '../shared/GeoUtils';
import { NativeCanvas, NativeFactory } from '../native';
import {
    IFeature, Geometry, Point, LineString, ICoordinate, GeometryCollection,
    MultiPoint, GeometryCollectionBase, MultiLineString, MultiPolygon, Polygon,
    LinearRing, Envelope, IEnvelope
} from "ginkgoch-geom";

export type RenderAntialias = 'default' | 'none' | 'gray' | 'subpixel';

export type RenderPatternQuality = 'fast' | 'good' | 'best' | 'nearest' | 'bilinear';

export type RenderQuality = 'fast' | 'good' | 'best' | 'nearest' | 'bilinear';

export type RenderTextDrawingMode = 'path' | 'glyph';

export interface RenderContextOptions {
    antialias: RenderAntialias,
    patternQuality: RenderPatternQuality,
    quality: RenderQuality,
    textDrawingMode: RenderTextDrawingMode,
    imageSmoothingEnabled: boolean
}

const emptyLineDash: any = [];

/**
 * This class represents a shared renderer that is used in this component.
 */
export class Render {
    /**
     * The image that is rendered on.
     */
    image: Image;
    /**
     * The canvas width for rendering.
     */
    width: number;
    /**
     * The canvas height for rendering.
     */
    height: number;
    /**
     * The concrete drawing object.
     */
    canvas: NativeCanvas;
    /**
     * The scale that is used to port world coordinate to screen coordinate.
     */
    scale: number;
    /**
     * The horizontal resolution.
     */
    resolutionX = 0;
    /**
     * The vertical resolution.
     */
    resolutionY = 0;
    /**
     * The world envelope of the viewport.
     */
    envelope: IEnvelope;
    
    private _contextOptions: RenderContextOptions;

    /**
     * Gets the drawing context options.
     */
    get contextOptions(): RenderContextOptions {
        return this._contextOptions;
    }

    /**
     * Sets the drawing context options.
     */
    set contextOptions(v: RenderContextOptions) {
        this._contextOptions = v;
        if (this.context !== undefined) {
            _.assign(this.context, v);
        }
    }

    /**
     * The concrete native drawing context.
     */
    context: any;
    /**
     * An array of drawn text bounding box cache. Used to avoid text overlapping.
     */
    textBounds: Array<IEnvelope> = new Array<IEnvelope>();

    simplifyTolerance: number = 1;

    /**
     * Constructs a renderer instance.
     * @param {Image} image The image to draws on.
     * @param {IEnvelope} envelope The world envelope of the viewport.
     * @param {Unit} envelopeUnit The geography unit of viewport envelope.
     */
    constructor(image: Image, envelope: IEnvelope, envelopeUnit: Unit = Unit.meters) {
        assert(image.width > 0, 'Image width must greater than 0.');
        assert(image.height > 0, 'Image height must greater than 0.');

        this.image = image;
        this.envelope = envelope;
        this.width = image.width;
        this.height = image.height;
        this.scale = GeoUtils.scale(envelope, envelopeUnit, { width: this.width, height: this.height });
        this.resolutionX = Math.abs(envelope.maxx - envelope.minx) / this.width;
        this.resolutionY = Math.abs(envelope.maxy - envelope.miny) / this.height;
        this._contextOptions = {
            antialias: 'default',
            patternQuality: 'good',
            quality: 'good',
            textDrawingMode: 'path',
            imageSmoothingEnabled: true
        };

        this.canvas = NativeFactory.nativeCanvas(this.width, this.height);
        this.context = this.canvas.getContext('2d');
        _.assign(this.context, this.contextOptions);
    }

    /**
     * This is a shortcut of creating a renderer instance with default settings.
     * 
     * @param {number} width The image width in pixel.
     * @param {number} height The image height in pixel.
     * @param {IEnvelope} envelope The viewport envelope.
     * @param {Unit} envelopeUnit The geography unit of viewport envelope 
     */
    static create(width: number = 256, height: number = 256,
        envelope: IEnvelope = { minx: -180, miny: -90, maxx: 180, maxy: 90 }, envelopeUnit = Unit.degrees): Render {
        const image = new Image(width, height);
        const render = new Render(image, envelope, envelopeUnit);
        return render;
    }

    /**
     * Flushes current drawing buffer to the image.
     */
    flush() {
        this.image.buffer = this.canvas.toBuffer();
    }

    /**
     * Measures the size of the text with the specified text style setting.
     * @param {string} text The text to be measured.
     * @param {any} style The raw text options that is defined with HTML text styles.
     * @returns The size of the text that is going to render.
     */
    measureText(text: string, style?: any): Size {
        if (style) {
            _.extend(this.context, style);
        }

        const width = this.context.measureText(text).width;
        const height = this.context.measureText('M').width;
        return { width, height };
    }

    /**
     * Fills the background
     * @param {any} bg The fill option. Can be color or a fill pattern.
     */
    drawBackground(bg: any) {
        if (!bg) return;

        this.context.beginPath();
        this.context.rect(0, 0, this.width, this.height);
        this.context.fillStyle = bg;
        this.context.fill();
    }

    /**
     * Draws features with the styles.
     * @param {IFeature[]} features The features to draw.
     * @param {any} style The raw HTML styles.
     */
    drawFeatures(features: IFeature[], style: any) {
        features.forEach(f => this.drawFeature(f, style));
    }

    /**
     * Draws features with the styles.
     * @param {IFeature} feature The feature to draw.
     * @param {any} style The raw HTML styles.
     */
    drawFeature(feature: IFeature, style: any) {
        this.drawGeometry(feature.geometry, style);
    }

    /**
     * Draws geometries with style.
     * @param {Geometry} geom The geometry to draw.
     * @param {any} style The raw HTML styles.
     */
    drawGeometry(geom: Geometry, style: any) {
        if (geom instanceof Point) {
            this._drawPoint(geom, style);
        } else if (geom instanceof LineString) {
            this._drawLineString(geom, style);
        } else if (geom instanceof Polygon) {
            this._drawPolygon(geom, style);
        } else if (geom instanceof MultiPoint) {
            this._drawMultiPoint(geom, style);
        } else if (geom instanceof MultiLineString) {
            this._drawMultiLine(geom, style);
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
        const screen = this._toViewport(geom);
        if (style.symbol === 'rect' || style.symbol === 'square') {
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

        this._setGeneralStyle(style);
        this._setContextOptions();
        this.context.fill();

        if (style && style.lineWidth !== 0) {
            this._setLineDash(style);
            this._setContextOptions();
            this.context.stroke();
        }
    }

    _drawLineString(geom: LineString, style: any) {
        let coordinates = geom.coordinatesFlat().map(c => this._toViewport(c));

        coordinates = RenderUtils.compressViewportCoordinates(coordinates, this.simplifyTolerance);
        if (coordinates.length <= 1) return;

        const first = coordinates[0];
        this.context.beginPath();
        this.context.moveTo(first.x, first.y);
        coordinates.slice(1).forEach(c => {
            this.context.lineTo(c.x, c.y);
        });

        if (style && style.lineWidth !== 0) {
            this._setGeneralStyle(style);
            this._setLineDash(style);
            this._setContextOptions();
            this.context.stroke();
        }
    }

    _drawPolygon(geom: Polygon, style: any) {
        this.context.beginPath();
        let drawn = this._drawRing(geom.externalRing);
        if (drawn) {
            geom.internalRings.forEach(r => {
                this._drawRing(r);
            });
        }

        this._setGeneralStyle(style);
        this._setPattern(style);
        this._setContextOptions();
        this.context.fill();

        if (style && style.lineWidth !== 0) {
            this._setLineDash(style);
            this._setContextOptions();
            this.context.stroke();
        }
    }

    private _setPattern(style: any) {
        if (typeof style.fillStyle === 'object' ) {
            let fillPattern = this.context.createPattern(style.fillStyle.image.source, style.fillStyle.repeat || 'repeat');
            this.context.fillStyle = fillPattern;
        }
    }

    private _setLineDash(style: any) {
        this.context.setLineDash(style.lineDash || emptyLineDash);
    }

    private _setGeneralStyle(style: any) {
        _.extend(this.context, style);
    }

    private _setContextOptions() {
        _.extend(this.context, this.contextOptions);
    }

    _drawRing(geom: LinearRing): boolean {
        let coordinates = geom.coordinatesFlat();
        coordinates = coordinates.map(c => this._toViewport(c));
        coordinates = RenderUtils.compressViewportCoordinates(coordinates, this.simplifyTolerance);

        if (coordinates.length < 4) {
            this.context.closePath();
            return false;
        }

        const first = coordinates[0];
        this.context.moveTo(first.x, first.y);
        coordinates.slice(1).forEach(c => this.context.lineTo(c.x, c.y));
        this.context.closePath();
        return true;
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

    /**
     * Draws text.
     * @param {string} text The text to draw.
     * @param {ICoordinate} coordinate The text where located.
     * @param {any} style The raw HTML style.
     */
    drawText(text: string, coordinate: ICoordinate, style: any) {
        coordinate = this._toViewport(coordinate);

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
                this.context.strokeText(text, x, y + offset);
            }

            this.context.fillText(text, x, y + offset);
        });
    }

    _rotate(x: number, y: number, rotation: number, action: (x: number, y: number) => void) {
        if (rotation && rotation !== 0) {
            rotation = this._headsUp(rotation);

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

    /**
     * Draws text on a polyline along with the line direction.
     * 
     * NOTE: the text will only be drawn when one of the polyline segment distance is larger than the text width. 
     * If the line is too short, it won't be drawn. Or reduce the size of the drawing envelope.
     * 
     * @param {string} text The text to draw.
     * @param {LineString} geom The polyline geometry to plot text.
     * @param {any} style The raw HTML style to draw.
     */
    drawTextOnLine(text: string, geom: LineString, style: any) {
        if (text.length === 0) return;

        let textPosition = this.getTextPositionOnLine(text, geom, style);
        if (textPosition === undefined) {
            return;
        }

        this._drawText(text, textPosition.position, style, textPosition.rotation);
    }

    getTextPositionOnLine(text: string, geom: LineString, style: any): { position: ICoordinate, rotation: number }|undefined {
        let coordinates = geom.coordinatesFlat();
        if (coordinates.length === 0) {
            return undefined;
        }

        _.extend(this.context, style);
        const textWidth = this.measureText(text, style).width;
        coordinates = coordinates.map(c => this._toViewport(c));

        let previous = coordinates[0];
        for (let i = 1; i < coordinates.length; i++) {
            const current = coordinates[i];
            const distance = RenderUtils.distance(current, previous);
            if (distance > textWidth) {
                const x = (previous.x + current.x) * .5;
                const y = (previous.y + current.y) * .5;
                const position = { x, y };
                const rotation = RenderUtils.angle(previous, current);

                return { position, rotation };
            }

            previous = current;
        }

        return undefined;
    }

    /**
     * Draws the icon.
     * @param {Image} icon The icon to draw. It is usually a marker.
     * @param {ICoordinate} coordinate The coordinate to plot the icon.
     * @param {any} style The raw HTML style to draw.
     */
    drawIcon(icon: Image, coordinate: ICoordinate, style: any) {
        coordinate = this._toViewport(coordinate);
        let left = coordinate.x - icon.width * .5;
        let top = coordinate.y - icon.height * .5;
        left += _.get(style, 'offsetX', 0);
        top += _.get(style, 'offsetY', 0);

        this.context.drawImage(icon.source, left, top);
    }

    private _toViewport(coordinate: ICoordinate) {
        return RenderUtils.toViewportCoordinate(coordinate, this.envelope, this.resolutionX, this.resolutionY);
    }

    private _headsUp(rotation: number) {
        if (rotation < 0) {
            rotation += Math.PI;
        }

        if (rotation > Math.PI / 2) {
            rotation += Math.PI;
        }

        return rotation;
    }
}