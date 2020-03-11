import { IFeature, MultiPoint, MultiPolygon, Point, Polygon, LineString, MultiLineString, GeometryCollectionBase, Geometry, GeometryCollection, ICoordinate } from "ginkgoch-geom";
import { Style } from "./Style";
import { StyleUtils } from "./StyleUtils";
import { Render } from "../render";
import { JSONKnownTypes } from "../shared/JSONUtils";

/** 
 * This class represents text style for drawing text based on feature properties on various geometries. 
 * @category styles
 */
export class TextStyle extends Style {
    /** 
     * The text content to draw. It can be either a concrete string with or without a placeholder to replace on the fly.
     * 
     * Renders "FOO" as text content on all features.
     * ```typescript
     * textStyle.content = "FOO";
     * ```
     * 
     * Renders a value based on a field name "NAME".
     * ```typescript
     * textStyle.content = "[NAME]";
     * ```
     * 
     * Renders values based on multiple fields such as "NAME" and "Hobby", and join them with some static string.
     * ```typescript
     * textStyle.content = "Hi [NAME], I like [Hobby]";
     * ```
     */
    content: string | undefined;
    /** The font string including either font family or size or both. e.g. "ARIAL 12px". */
    font: string;
    /** The font color string. e.g. "#000000" or "black". */
    fillStyle: string;
    /** The text alignment. */
    textAlign: "start" | "end" | "left" | "right" | "center";
    /** The outline color string on text. If it is not set, no outline will be drawn. */
    strokeStyle: string | undefined;
    /** The outline stroke width in pixel on text. If it is zero, no outline will be drawn. */
    lineWidth: number;
    /** Use `centroid` or `interior` as text location. Default is `centroid`. */
    location: 'centroid' | 'interior';
    /**
     * Constructs a text style instance.
     * @param {string|undefined} content The text content to draw. It can be either a concrete string with or without a placeholder to replace on the fly.
     * 
     * Renders "FOO" as text content on all features.
     * ```typescript
     * textStyle.content = "FOO";
     * ```
     * 
     * Renders a value based on a field name "NAME".
     * ```typescript
     * textStyle.content = "[NAME]";
     * ```
     * 
     * Renders values based on multiple fields such as "NAME" and "Hobby", and join them with some static string.
     * ```typescript
     * textStyle.content = "Hi [NAME], I like [Hobby]";
     * ```
     * 
     * @param {string} fillStyle The font color string. e.g. "#000000" or "black". 
     * @param {string} font The font string including either font family or size or both. e.g. "ARIAL 12px". 
     * @param {string} name The name of this style.
     */
    constructor(content?: string, fillStyle?: string, font?: string, name: string = 'Text Style') {
        super();

        this.name = name;
        this.type = JSONKnownTypes.textStyle;
        this.content = content;
        this.textAlign = 'center';
        this.font = font || '12px ARIAL';
        this.lineWidth = 0;
        this.location = 'centroid';
        this.fillStyle = StyleUtils.colorOrRandomDark(fillStyle);
    }

    /**
     * Collects the raw HTML style keys that will be included in the returning raw styles.
     */
    protected _htmlStyleKeys(): string[] {
        return [
            'font',
            'fillStyle',
            'textAlign',
            'strokeStyle',
            'lineWidth'
        ];
    }

    /**
     * The concrete draw operation.
     * @param {IFeature[]} features The features to draw. 
     * @param {any} styleJson The raw HTML style.
     * @param {Render} render The renderer to draw.
     */
    protected _draw(features: IFeature[], styleJson: any, render: Render) {
        if (this.content === undefined) return;

        features.forEach(f => this._drawFeature(f, styleJson, render));
    }

    private _drawFeature(feature: IFeature, styleJson: any, render: Render) {
        const props = this._filterProperties(feature);
        const text = this._formatContent(props);

        const geom = feature.geometry;
        if (geom instanceof MultiPoint) {
            this._drawTextForGeomCollection(geom, text, styleJson, render);
        } else if (geom instanceof MultiPolygon) {
            this._drawTextForMultiPolygon(geom, text, styleJson, render);
        } else if (geom instanceof GeometryCollection) {
            this._drawTextForGeomCollection(geom, text, styleJson, render);
        } else if (geom instanceof Point || geom instanceof Polygon) {
            let geomLocation = this._locationOnGeom(geom);
            this._drawTextOnCoordinate(render, text, geomLocation, styleJson);
        } else if (geom instanceof LineString) {
            this._drawTextOnLine(render, text, geom, styleJson);
        } else if (geom instanceof MultiLineString) {
            geom.children.forEach(l => {
                this._drawTextOnLine(render, text, l, styleJson);
            });
        }
    }

    protected _drawTextOnCoordinate(render: Render, text: string, position: ICoordinate, style: any) {
        render.drawText(text, position, style);
    }

    protected _drawTextOnLine(render: Render, text: string, line: LineString, style: any) {
        render.drawTextOnLine(text, line, style);
    }

    /**
     * Collects the required field names that will be used for rendering.
     * @returns {string[]} The required field names that will be used for rendering.
     */
    fields(): string[] {
        const fields = this._extractFields();
        return fields;
    }

    /**
     * Normalize multiple font settings into a HTML font expression.
     * @param {string} fontFamily The font family. e.g. "arial".
     * @param {number} fontSize The font size. Default size is 12. 
     * @param {FontWeight} fontWeight The font weight.
     * @param {FontStyle} fontStyle The font style.
     * @returns {string} A normalized font style string. e.g. "italic small-caps bold 12px arial".
     */
    static normalizeFont(fontFamily: string = 'arial', fontSize: number = 12, fontWeight: FontWeight = 'normal', fontStyle: FontStyle = 'normal') {
        // e.g. italic small-caps bold 12px arial
        const fontSizeStr = `${fontSize}px`
        const fontItems = [fontStyle, fontWeight, fontSizeStr, fontFamily];
        const fontStr = fontItems.filter(f => f !== 'normal').join(' ');
        return fontStr;
    }

    private _formatContent(props: Map<string, any>) {
        let content = this.content as string;
        props.forEach((v, k) => {
            content = content.replace(`[${k}]`, v);
        });

        return content;
    }

    private _filterProperties(feature: IFeature) {
        const fields = this._extractFields();
        const props = new Map<string, any>();
        fields.forEach(f => {
            if (feature.properties.has(f)) {
                props.set(f, feature.properties.get(f));
            }
        });

        return props;
    }

    private _extractFields() {
        if (this.content === undefined) return [];

        const fields = this.content.match(/(?!=\[)\w+(?=\])/g);
        return fields || [];
    }

    private _drawTextForGeomCollection<T extends Geometry>(geom: GeometryCollectionBase<T>, text: string, styleJson: any, render: Render) {
        geom.children.forEach(g => {
            const locationOnGeom = this._locationOnGeom(g);
            this._drawTextOnCoordinate(render, text, locationOnGeom, styleJson);
        });
    }

    private _drawTextForMultiPolygon(geom: MultiPolygon, text: string, styleJson: any, render: Render) {
        if (geom.children.length === 0) {
            return;
        }

        const drawingPolygon = geom.children.map(polygon => ({ factor: this._polygonSortFactor(polygon), polygon })).sort((p1, p2) => p2.factor - p1.factor)[0];
        const locationOnGeom = this._locationOnGeom(drawingPolygon.polygon);
        this._drawTextOnCoordinate(render, text, locationOnGeom, styleJson);
    }

    private _polygonSortFactor(polygon: Polygon): number {
        const box = polygon.envelope();
        return box.width + box.height;
    }

    private _locationOnGeom(geom: Geometry): ICoordinate {
        switch (this.location) {
            case 'interior':
                return geom.interiorPoint();
            default:
                return geom.centroid();
        }
    }
}

/** This type defines the options of font weight. */
export type FontWeight = 'normal' | 'bold' | 'bolder' | 'light';

/** This type defines the options for font style. */
export type FontStyle = 'normal' | 'italic' | 'oblique';

/** This class represents some useful functions for fonts.  */
export class FontFamilies {
    private static _families = ["Abadi MT Condensed Light", "Aharoni", "Aharoni Bold", "Aldhabi", "AlternateGothic2 BT", "Andale Mono", "Andalus", "Angsana New", "AngsanaUPC", "Aparajita", "Apple Chancery", "Arabic Typesetting", "Arial", "Arial Black", "Arial narrow", "Arial Nova", "Arial Rounded MT Bold", "Arnoldboecklin", "Avanta Garde", "Bahnschrift", "Bahnschrift Light", "Bahnschrift SemiBold", "Bahnschrift SemiLight", "Baskerville", "Batang", "BatangChe", "Big Caslon", "BIZ UDGothic", "BIZ UDMincho Medium", "Blippo", "Bodoni MT", "Book Antiqua", "Bookman", "Bradley Hand", "Browallia New", "BrowalliaUPC", "Brush Script MT", "Brush Script Std", "Brushstroke", "Calibri", "Calibri Light", "Calisto MT", "Cambodian", "Cambria", "Cambria Math", "Candara", "Century Gothic", "Chalkduster", "Cherokee", "Comic Sans", "Comic Sans MS", "Consolas", "Constantia", "Copperplate", "Copperplate Gothic Light", "Copperplate Gothic Bold", "Corbel", "Cordia New", "CordiaUPC", "Coronetscript", "Courier", "Courier New", "DaunPenh", "David", "DengXian", "DFKai-SB", "Didot", "DilleniaUPC", "DokChampa", "Dotum", "DotumChe", "Ebrima", "Estrangelo Edessa", "EucrosiaUPC", "Euphemia", "FangSong", "Florence", "Franklin Gothic Medium", "FrankRuehl", "FreesiaUPC", "Futara", "Gabriola", "Gadugi", "Garamond", "Gautami", "Geneva", "Georgia", "Georgia Pro", "Gill Sans", "Gill Sans Nova", "Gisha", "Goudy Old Style", "Gulim", "GulimChe", "Gungsuh", "GungsuhChe", "Hebrew", "Hoefler Text", "HoloLens MDL2 Assets", "Impact", "Ink Free", "IrisUPC", "Iskoola Pota", "Japanese", "JasmineUPC", "Javanese Text", "Jazz LET", "KaiTi", "Kalinga", "Kartika", "Khmer UI", "KodchiangUPC", "Kokila", "Korean", "Lao", "Lao UI", "Latha", "Leelawadee", "Leelawadee UI", "Leelawadee UI Semilight", "Levenim MT", "LilyUPC", "Lucida Bright", "Lucida Console", "Lucida Handwriting", "Lucida Sans", "Lucida Sans Typewriter", "Lucida Sans Unicode", "Lucidatypewriter", "Luminari", "Malgun Gothic", "Malgun Gothic Semilight", "Mangal", "Marker Felt", "Marlett", "Meiryo", "Meiryo UI", "Microsoft Himalaya", "Microsoft JhengHei", "Microsoft JhengHei UI", "Microsoft New Tai Lue", "Microsoft PhagsPa", "Microsoft Sans Serif", "Microsoft Tai Le", "Microsoft Uighur", "Microsoft YaHei", "Microsoft YaHei UI", "Microsoft Yi Baiti", "MingLiU", "MingLiU_HKSCS", "MingLiU_HKSCS-ExtB", "MingLiU-ExtB", "Miriam", "Monaco", "Mongolian Baiti", "MoolBoran", "MS Gothic", "MS Mincho", "MS PGothic", "MS PMincho", "MS UI Gothic", "MV Boli", "Myanmar Text", "Narkisim", "Neue Haas Grotesk Text Pro", "New Century Schoolbook", "News Gothic MT", "Nirmala UI", "No automatic language associations", "Noto", "NSimSun", "Nyala", "Oldtown", "Optima", "Palatino", "Palatino Linotype", "papyrus", "Parkavenue", "Perpetua", "Plantagenet Cherokee", "PMingLiU", "Raavi", "Rockwell", "Rockwell Extra Bold", "Rockwell Nova", "Rockwell Nova Cond", "Rockwell Nova Extra Bold", "Rod", "Sakkal Majalla", "Sanskrit Text", "Segoe MDL2 Assets", "Segoe Print", "Segoe Script", "Segoe UI", "Segoe UI Emoji", "Segoe UI Historic", "Segoe UI Symbol", "Shonar Bangla", "Shruti", "SimHei", "SimKai", "Simplified Arabic", "Simplified Chinese", "SimSun", "SimSun-ExtB", "Sitka", "Snell Roundhan", "Stencil Std", "Sylfaen", "Symbol", "Tahoma", "Thai", "Times New Roman", "Traditional Arabic", "Traditional Chinese", "Trattatello", "Trebuchet MS", "Tunga", "UD Digi Kyokasho", "UD Digi KyoKasho NK-R", "UD Digi KyoKasho NP-R", "UD Digi KyoKasho N-R", "Urdu Typesetting", "URW Chancery", "Utsaah", "Vani", "Verdana", "Verdana Pro", "Vijaya", "Vrinda", "Webdings", "Westminster", "Wingdings", "Yu Gothic", "Yu Gothic UI", "Yu Mincho", "Zapf Chancery"];

    /**
     * Gets all common font family names.
     * @returns {string[]} Common font family names.
     */
    static get families() {
        return this._families;
    }
}