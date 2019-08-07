import _ from "lodash";
import { Opener } from "../shared/Opener";
import { FeatureSource } from "../sources/FeatureSource";
import { Style } from "../styles/Style";
import { Render } from "../render/Index";
import Validator from "../shared/Validator";

export class FeatureLayer extends Opener {
    source: FeatureSource;
    styles: Array<Style>;
    minimumScale: number;
    maximumScale: number;

    constructor(source: FeatureSource) {
        super();

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

    async draw(render: Render) {
        Validator.checkOpened(this);
        if(!this._isVisible(render.scale, this.maximumScale, this.minimumScale)) {
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

    private _isVisible(scale: number, maxScale: number, minScale: number) {
        return scale >= minScale && scale <= maxScale;
    }
}