import _ from "lodash";
import { FeatureSource } from "./FeatureSource";
import { Style } from "../styles/Style";
import { Render, Image } from "../render";
import { Opener, Validator, Constants, JsonKnownTypes } from "../shared";
import { FeatureSourceFactory } from ".";
import { StyleFactory } from "../styles";

export class FeatureLayer extends Opener {
    name: string;
    source: FeatureSource;
    styles: Array<Style>;
    minimumScale: number;
    maximumScale: number;

    constructor(source: FeatureSource) {
        super();

        this.name = 'Unknown';
        this.source = source;
        this.styles = new Array<Style>();
        this.minimumScale = 0;
        this.maximumScale = Constants.POSITIVE_INFINITY_SCALE;
    }

    pushStyles(styles: Array<Style>) {
        for (let style of styles) {
            this.styles.push(style);
        }
    }

    /**
     * @override
     */
    protected async _open(): Promise<void> {
        await this.source.open();
    }

    /**
     * @override
     */
    protected async _close(): Promise<void> {
        await this.source.close();
    }

    async envelope() {
        Validator.checkOpened(this);

        return await this.source.envelope();
    }

    async draw(render: Render) {
        Validator.checkOpened(this);

        if (!this._isVisible(render.scale, this.maximumScale, this.minimumScale)) {
            return;
        }

        const styles = this.styles.filter(s => this._isVisible(render.scale, s.maximumScale, s.minimumScale));
        const fields = _.chain(styles).flatMap(s => s.fields()).uniq().value();
        const envelope = render.envelope;
        const features = await this.source.features(envelope, fields);
        styles.forEach(style => {
            style.drawAll(features, render);
        });
    }

    async thumbnail(width = 256, height = 256): Promise<Image> {
        const envelope = await this.envelope();
        const render = Render.create(width, height, envelope, this.source.projection.from.unit);
        await this.draw(render);
        render.flush();

        return render.image;
    }

    toJSON(): any {
        return this._toJSON();
    }

    protected _toJSON() {
        return {
            type: JsonKnownTypes.featureLayer,
            name: this.name,
            source: this.source.toJSON(),
            styles: this.styles.map(style => style.toJSON()),
            minimumScale: this.minimumScale,
            maximumScale: this.maximumScale
        }
    }

    static parseJSON(json: any) {
        const source = FeatureSourceFactory.parseJSON(json.source) as FeatureSource;
        const layer = new FeatureLayer(source);
        layer.name = json.name;
        layer.minimumScale = json.minimumScale;
        layer.maximumScale = json.maximumScale;
        layer.styles = (<any[]>json.styles).map(j => {
            return StyleFactory.parseJSON(j);
        });
        return layer;
    }

    private _isVisible(scale: number, maxScale: number, minScale: number) {
        return scale >= minScale && scale <= maxScale;
    }
}