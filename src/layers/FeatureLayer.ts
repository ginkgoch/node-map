import _ from "lodash";
import { FeatureSource } from "./FeatureSource";
import { Style } from "../styles/Style";
import { Render, Image } from "../render";
import { Opener, Validator } from "../shared";

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
        this.maximumScale = Number.POSITIVE_INFINITY;
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
        const render = Render.create(width, height, envelope, this.source.projection.fromUnit);
        await this.draw(render);
        render.flush();

        return render.image;
    }

    private _isVisible(scale: number, maxScale: number, minScale: number) {
        return scale >= minScale && scale <= maxScale;
    }
}