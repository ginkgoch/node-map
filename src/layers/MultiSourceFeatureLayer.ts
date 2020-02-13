import _ from "lodash";
import { FeatureSource } from "./sources/FeatureSource";
import { Style } from "../styles/Style";
import { Render } from "../render";
import { Validator, JSONKnownTypes } from "../shared";
import { FeatureSourceFactory } from ".";
import { StyleFactory } from "../styles";
import uuid from "../shared/UUID";
import { Layer } from "./Layer";
import { Envelope, IEnvelope } from "ginkgoch-geom";
import { Srs } from "./Projection";

/**
 * FeatureLayer responses for rendering FeatureSource with styles.
 * 
 * ```typescript
 * const source = new ShapefileFeatureSource('./tests/data/layers/USStates.shp');
 * const layer = new MultiSourceFeatureLayer([source]);
 * layer.styles.push(new FillStyle('#886600', 'red', 2));
 * ...
 * ```
 */
export class MultiSourceFeatureLayer extends Layer {
    sources: Array<FeatureSource>;
    styles: Array<Style>;

    /**
     * Constructs a FeatureLayer instance.
     * @param {FeatureSource} source The feature source where the features are fetched.
     * @param {string} name The name of this layer. Optional with default value `layer-${uuid()}`.
     */
    constructor(sources: Array<FeatureSource>, name?: string) {
        super(name);

        this.name = name || this.id;
        this.sources = new Array<FeatureSource>();
        sources && this.sources.push(...sources);

        this.styles = new Array<Style>();
    }

    /**
     * Pushes multiple styles into this layer.
     * @param {Array<Style>} styles The styles to render features.
     */
    pushStyles(styles: Array<Style>) {
        for (let style of styles) {
            this.styles.push(style);
        }
    }

    /**
     * Opens this layer and prepares the resources for querying and rendering.
     */
    protected async _open(): Promise<void> {
        for (let source of this.sources) {
            await source.open();
        }
    }

    /**
     * Closes this layer and release its related resources.
     */
    protected async _close(): Promise<void> {
        for (let source of this.sources) {
            await source.close();
        }
    }

    /**
     * Gets the envelope of this layer.
     * @returns {Envelope} The envelope of this layer.
     */
    async envelope(): Promise<Envelope> {
        Validator.checkOpened(this);

        let envelope = new Envelope(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);
        for (let source of this.sources) {
            let currentEnvelope = await source.envelope();
            envelope.expand(currentEnvelope);
        }

        return envelope;
    }

    protected getCRS() {
        if (this.sources.length === 0) {
            return new Srs('WGS84');
        }

        return this.sources[0].projection.from;
    }

    /**
     * Draws this layer with styles and feature source in a restricted envelope.
     * @param {Render} render The renderer that holds the image source and necessary spatial infos.
     */
    async _draw(render: Render) {
        const styles = this.styles.filter(s => s.visible && this.scaleVisible(render.scale));
        if (styles.length === 0) {
            return;
        }

        Validator.checkOpened(this);
        
        let envelope = render.envelope;
        envelope = this.applyMargin(envelope, render);
        
        const fields = _.chain(styles).flatMap(s => s.fields()).uniq().value();
        for (let source of this.sources) {
            const features = await source.features(envelope, fields);
            styles.forEach(style => {
                style.drawAll(features, render);
            });
        }
    }

    /**
     * Converts this layer into a JSON format data.
     * @returns A JSON format data of this layer.
     * 
     */
    protected _toJSON() {
        return {
            type: JSONKnownTypes.featureLayer,
            id: this.id,
            name: this.name,
            sources: this.sources.map(s => s.toJSON()),
            styles: this.styles.map(style => style.toJSON()),
            minimumScale: this.minimumScale,
            maximumScale: this.maximumScale,
            visible: this.visible
        }
    }

    /**
     * Parses the given JSON format data to a FeatureLayer instance. 
     * The JSON data must match FeatureLayer schema.
     * @param {any} json The JSON format data of this layer.
     * @returns {FeatureLayer} A FeatureLayer instance.
     */
    static parseJSON(json: any) {
        const sources = (<any[]>json.sources).map(s => FeatureSourceFactory.parseJSON(s) as FeatureSource);
        const layer = new MultiSourceFeatureLayer(sources);
        layer.id = _.defaultTo(json.id, 'layer-' + uuid());
        layer.name = _.defaultTo(json.name, 'Unknown');
        layer.visible = _.defaultTo(json.visible, true);
        layer.minimumScale = _.defaultTo(json.minimumScale, 0);
        layer.maximumScale = _.defaultTo(json.maximumScale, Number.POSITIVE_INFINITY);
        layer.styles = (<any[]>json.styles).map(j => {
            return StyleFactory.parseJSON(j);
        });

        return layer;
    }
}