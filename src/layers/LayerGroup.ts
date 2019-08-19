import { Envelope, IEnvelope } from "ginkgoch-geom";
import { FeatureLayer } from ".";
import { Render } from "../render";
import { JSONKnownTypes } from "../shared";

export class LayerGroup {
    name: string;
    visible: boolean = true;
    layers: Array<FeatureLayer>;

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
        if (!this.visible) {
            return;
        }

        for (let layer of this.layers) {
            if (!layer.visible) {
                continue;
            }

            await layer.open();
            await layer.draw(render);
        }
    }

    layer(name: string): FeatureLayer | undefined {
        return this.layers.find(l => l.name === name);
    }

    toJSON(): any {
        return this._toJSON();
    }

    protected _toJSON(): any {
        return {
            type: JSONKnownTypes.layerGroup,
            name: this.name,
            visible: this.visible,
            layers: this.layers.map(layer => layer.toJSON())
        };
    }

    static parseJSON(json: any) {
        const group = new LayerGroup();
        group.name = json.name;
        group.visible = json.visible;
        group.layers = (<any[]>json.layers).map(j => {
            return FeatureLayer.parseJSON(j);
        });

        return group;
    }
}