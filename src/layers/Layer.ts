import _ from "lodash";
import uuid from "../shared/UUID";
import { Constants, Render, Image } from "..";
import { IEnvelope, Envelope } from "ginkgoch-geom";
import { Srs } from "./Projection";
import { Opener } from "../shared/Opener";

/** @category layer */
export abstract class Layer extends Opener {
    id: string;
    name: string;
    minimumScale: number;
    maximumScale: number;
    visible = true;
    margin = 5;

    constructor(name?: string) {
        super();

        this.id = 'layer-' + uuid();
        this.name = name || this.id;
        this.minimumScale = 0;
        this.maximumScale = Constants.POSITIVE_INFINITY_SCALE;
    }

    abstract async envelope(): Promise<Envelope>;

    /**
     * Enlarges the specified envelope based on the `margin` property.
     * @param {IEnvelope} envelope The envelope to enlarge.
     * @param {Render} render The render.
     * @returns {Envelope} The enlarged envelope.
     */
    applyMargin(envelope: IEnvelope, render: Render): Envelope {
        let { minx, miny, maxx, maxy } = envelope;

        if (this.margin > 0) {
            const marginWidth = render.resolutionX * this.margin;
            const marginHeight = render.resolutionY * this.margin;
            minx -= marginWidth;
            maxx += marginWidth;
            miny -= marginHeight;
            maxy += marginHeight;
        }

        return new Envelope(minx, miny, maxx, maxy);
    }

    protected abstract getCRS(): Srs

    /**
     * Gets a thumbnail image of this layer.
     * @param {number} width The width in pixel of the thumbnail image.
     * @param {number} height The height in pixel of the thumbnail image.
     */
    async thumbnail(width = 256, height = 256): Promise<Image> {
        const envelope = await this.envelope();
        const render = Render.create(width, height, envelope, this.getCRS().unit);
        await this.draw(render);
        render.flush();

        return render.image;
    }

    /**
     * Converts this layer into a JSON format data.
     * @returns A JSON format data of this layer.
     */
    toJSON(): any {
        return this._toJSON();
    }

    /**
     * Converts this layer into a JSON format data.
     * @returns A JSON format data of this layer.
     * 
     */
    protected abstract _toJSON(): any;

    /**
     * Draws this layer with styles and feature source in a restricted envelope.
     * @param {Render} render The renderer that holds the image source and necessary spatial infos.
     */
    public async draw(render: Render) {
        let shouldDraw = this.shouldDraw(render);
        if (!shouldDraw) return;

        await this._draw(render);
    }

    /**
     * Draws this layer with styles and feature source in a restricted envelope.
     * @param {Render} render The renderer that holds the image source and necessary spatial infos.
     */
    protected abstract async _draw(render: Render): Promise<void>;

    protected shouldDraw(render: Render): boolean {
        return this.visible && this.scaleVisible(render.scale);
    }

    protected scaleVisible(scale: number): boolean {
        return scale <= this.maximumScale && scale >= this.minimumScale;
    }
}