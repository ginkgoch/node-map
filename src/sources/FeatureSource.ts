import { IEnvelope, Feature, IFeature, Envelope } from "ginkgoch-geom";
import { FieldFilterOptions } from "./FieldFilterOptions";
import { Opener } from "./Opener";
import { Field } from "./Field";

export abstract class FeatureSource extends Opener {
    srs?: string;
    name: string;

    constructor() { 
        super();
        
        this.name = 'Unknown';
    }

    async features(envelope?: IEnvelope, envelopeSrs?: string): Promise<Feature[]> {
        this._checkOpened();

        let envelopeIn = envelope;
        if (envelopeIn !== undefined) {
            envelopeIn = this._inverseProjection(envelopeIn, envelopeSrs);
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

    async envelope(srs?: string) {
        this._checkOpened();
        return await this._envelope(srs);
    }

    protected abstract async _envelope(srs?: string): Promise<Envelope>;

    protected _inverseProjection(envelope: IEnvelope, envelopeSrs?: string): IEnvelope;
    protected _inverseProjection(feature: IFeature, featureSrs?: string): Feature;
    protected _inverseProjection(param: IEnvelope | IFeature, paramSrs?: string): IEnvelope | Feature {
        throw new Error();
    }

    protected _forwardProjection(feature: IFeature): Feature
    protected _forwardProjection(features: IFeature[]): Feature[]
    protected _forwardProjection(param: IFeature | IFeature[]): Feature | Feature[] {
        throw new Error();
    }

    async feature(id: string, fields?: FieldFilterOptions, geomSrc?: string): Promise<Feature> {
        let feature = await this._feature(id, fields);
        feature = this._forwardProjection(feature);
        return feature;
    }

    protected abstract async _feature(id: string, fields?: FieldFilterOptions): Promise<Feature>;

    //#region edit
    editable() {
        return false;
    }

    async push(feature: IFeature, featureSrs?: string) {
        this._checkEditable();

        const featureIn = this._inverseProjection(feature, featureSrs);
        this._push(featureIn);
    }

    protected async _push(feature: IFeature) { 
        this._notImplemented();
    }

    async update(feature: IFeature, featureSrs?: string) {
        this._checkEditable();

        const featureIn = this._inverseProjection(feature, featureSrs);
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
}