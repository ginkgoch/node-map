import _ from "lodash";
import { FeatureSource } from "./FeatureSource";
import { Style } from "../styles/Style";
import { Render, Image } from "../render";
import { Opener, Validator, Constants, JSONKnownTypes } from "../shared";
import { FeatureSourceFactory } from ".";
import { StyleFactory } from "../styles";
import uuid from "../shared/UUID";

export class FeatureLayer extends Opener {
    id: string;
    name: string;
    source: FeatureSource;
    styles: Array<Style>;
    minimumScale: number;
    maximumScale: number;
    visible = true;

    constructor(source: FeatureSource, name?: string) {
        super();

        this.id = 'layer-' + uuid();
        this.name = name || source.name;
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
        if (!this.visible || !this._scaleInRange(render.scale, this.maximumScale, this.minimumScale)) {
            return;
        }

        Validator.checkOpened(this);

        const styles = this.styles.filter(s => s.visible && this._scaleInRange(render.scale, s.maximumScale, s.minimumScale));
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
            type: JSONKnownTypes.featureLayer,
            id: this.id,
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
        layer.id = _.defaultTo(json.id, 'layer-' + uuid());
        layer.name = _.defaultTo(json.name, 'Unknown');
        layer.minimumScale = _.defaultTo(json.minimumScale, 0);
        layer.maximumScale = _.defaultTo(json.maximumScale, Number.POSITIVE_INFINITY);
        layer.styles = (<any[]>json.styles).map(j => {
            return StyleFactory.parseJSON(j);
        });

        return layer;
    }

    private _scaleInRange(scale: number, maxScale: number, minScale: number) {
        return scale >= minScale && scale <= maxScale;
    }
}