import { Envelope, IEnvelope } from "ginkgoch-geom";
import { FeatureLayer } from ".";
import { Render } from "../render";
import { JsonKnownTypes } from "../shared";

export class LayerGroup {
    name: string
    layers: Array<FeatureLayer>
    constructor(layers?: Array<FeatureLayer>, name: string = 'Unknown') {
        this.name = name;
        this.layers = new Array<FeatureLayer>();
        layers && layers.forEach(layer => this.layers.push(layer));
    }

    async envelope() {
        const envelopes = new Array<IEnvelope>();
        for (let layer of this.layers) {
            await layer.open();
            const envelope = await layer.envelope();
            envelopes.push(envelope);
        }

        return Envelope.unionAll(envelopes);
    }

    push(layer: FeatureLayer): void {
        this.layers.push(layer);
    }

    pushAll(layers: Array<FeatureLayer>) {
        layers.forEach(l => this.layers.push(l));
    }

    async draw(render: Render): Promise<void> {
        for (let layer of this.layers) {
            await layer.open();
            await layer.draw(render);
        }
    }

    layer(name: string): FeatureLayer | undefined {
        return this.layers.find(l => l.name === name);
    }

    json(): any {
        return this._json();
    }

    protected _json(): any {
        return {
            type: JsonKnownTypes.layerGroup,
            name: this.name,
            layers: this.layers.map(layer => layer.json())
        };
    }

    static parseJson(json: any) {
        const group = new LayerGroup();
        group.name = json.name;
        group.layers = (<any[]>json.layers).map(j => {
            return FeatureLayer.parseJson(j);
        });

        return group;
    }
}