import _ from "lodash";
import { IEnvelope, Envelope } from "ginkgoch-geom";
import { Render } from "../render";
import { LayerGroup, FeatureLayer, Srs } from "../layers";

export class GKMap {
    name = 'GKMap';
    srs?: Srs;
    width: number;
    height: number;
    background?: string;
    maximumScale = Number.POSITIVE_INFINITY;
    minimumScale = 0;
    groups: Array<LayerGroup>;

    constructor(width?: number, height?: number, srs?: string) {
        this.width = width || 256;
        this.height = height || 256;
        this.srs = new Srs(srs || 'EPSG:3857');
        this.groups = new Array<LayerGroup>();
    }

    async envelope() {
        const envelopes = new Array<IEnvelope>();
        for (let group of this.groups) {
            envelopes.push(await group.envelope());
        }
        let envelope = Envelope.unionAll(envelopes);
        return envelope;
    }

    pushLayers(layers: Array<FeatureLayer>, groupName: string = 'Default') {
        let group = this.groups.find(g => g.name === groupName);
        if (!group) {
            group = new LayerGroup([], groupName);
            this.groups.push(group);
        }

        group.pushAll(layers);
    }

    pushGroups(groups: Array<LayerGroup>) {
        for (let group of groups) {
            this.groups.push(group);
        }
    }

    group(name: string): LayerGroup | undefined {
        return this.groups.find(g => g.name === name);
    }

    layer(name: string): FeatureLayer | undefined {
        return _.flatMap(this.groups, g => g.layers).find(l => l.name === name);
    }

    async draw(envelope?: IEnvelope) {
        if (!envelope) {
            envelope = await this.envelope();
        }

        const render = Render.create(this.width, this.height, envelope, this.srs!.unit);
        for (let group of this.groups) {
            await group.draw(render);
        }

        render.flush();
        return render.image;
    }
}