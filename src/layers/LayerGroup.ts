import { FeatureLayer } from ".";
import { Render } from "../render";

export class LayerGroup {
    name: string
    layers: Array<FeatureLayer>
    constructor(layers?: Array<FeatureLayer>) {
        this.name = 'Unknown';
        this.layers = new Array<FeatureLayer>();
        layers && layers.forEach(layer => this.layers.push(layer));
    }

    push(layer: FeatureLayer): void {
        this.layers.push(layer);
    }

    pushAll(layers: Array<FeatureLayer>) {
        layers.forEach(l => this.layers.push(l));
    }

    async draw(render: Render): Promise<void> {
        for (let layer of this.layers) {
            await layer.open()
            await layer.draw(render);
        }
    }

    layer(name: string): FeatureLayer | undefined {
        return this.layers.find(l => l.name === name);
    }
}