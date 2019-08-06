import _ from "lodash";
import { IEnvelope, Feature, IFeature, Envelope } from "ginkgoch-geom";
import { Field } from "./Field";
import { Opener } from "./Opener";
import { Projection } from "../projection/Projection";
import { FieldFilterOptions } from "./FieldFilterOptions";

export abstract class FeatureSource extends Opener {
    name: string;
    projection: Projection

    constructor() {
        super();

        this.name = 'Unknown';
        this.projection = new Projection();
    }

    async features(envelope?: IEnvelope): Promise<Feature[]> {
        this._checkOpened();

        let envelopeIn = envelope;
        if (envelopeIn !== undefined) {
            envelopeIn = this._inverseProjection(envelopeIn);
        }
        const featuresIn = await this._features(envelopeIn);
        const featuresOut = this._forwardProjection(featuresIn);
        return featuresOut;
    }

    protected abstract async _features(envelope?: IEnvelope): Promise<Feature[]>;

    async count() {
        this._checkOpened();

        return (await this.features()).length;
    }

    async fields() {
        this._checkOpened();

        return await this._fields();
    }

    protected abstract async _fields(): Promise<Field[]>;

    async envelope() {
        this._checkOpened();

        let envelope = await this._envelope();
        return this.projection.forward(envelope);
    }

    protected abstract async _envelope(): Promise<Envelope>;

    get srs(): string | undefined {
        return this.projection.from;
    }

    set srs(srs: string|undefined) {
        this.projection.from = srs;
    }

    protected _inverseProjection(envelope: IEnvelope): IEnvelope;
    protected _inverseProjection(feature: IFeature): Feature;
    protected _inverseProjection(param: IEnvelope | IFeature): IEnvelope | Feature {
        if (this.isEnvelope(param)) {
            let envelope = param as IEnvelope;
            envelope = this.projection.inverse(envelope);
            return envelope;
        } else {
            let f = param as IFeature;
            let geometry = f.geometry.clone(c => this.projection.inverse(c));
            return new Feature(geometry, f.properties, f.id);
        }
    }

    protected _forwardProjection(feature: IFeature): Feature
    protected _forwardProjection(features: IFeature[]): Feature[]
    protected _forwardProjection(param: IFeature | IFeature[]): Feature | Feature[] {
        if (Array.isArray(param)) {
            let features = param as IFeature[];
            return features.map(f => {
                let geom = f.geometry.clone(c => this.projection.forward(c));
                return new Feature(geom, f.properties, f.id);
            });
        } else {
            let f = param as IFeature;
            let geom = f.geometry.clone(c => this.projection.inverse(c));
            return new Feature(geom, f.properties, f.id);
        }
    }

    async feature(id: string, fields?: FieldFilterOptions): Promise<Feature> {
        let feature = await this._feature(id, fields);
        feature = this._forwardProjection(feature);
        return feature;
    }

    protected abstract async _feature(id: string, fields?: FieldFilterOptions): Promise<Feature>;

    //#region edit
    editable() {
        return false;
    }

    async push(feature: IFeature) {
        this._checkEditable();

        const featureIn = this._inverseProjection(feature);
        this._push(featureIn);
    }

    protected async _push(feature: IFeature) {
        this._notImplemented();
    }

    async update(feature: IFeature) {
        this._checkEditable();

        const featureIn = this._inverseProjection(feature);
        await this._update(featureIn);
    }

    protected async _update(feature: IFeature) {
        this._notImplemented();
    }

    async delete(id: number) {
        this._checkEditable();

        await this._delete(id);
    }

    async _delete(id: number) {
        this._notImplemented();
    }

    private _checkEditable() {
        if (!this.editable()) throw new Error('Source is not editable.');
    }

    private _notImplemented() {
        throw new Error('Not implemented');
    }
    //#endregion

    private isEnvelope(obj: any) {
        return ['minx', 'miny', 'maxx', 'maxy'].every(v => v in obj)
    }
}