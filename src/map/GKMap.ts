import _ from "lodash";
import { IEnvelope, Envelope } from "ginkgoch-geom";
import { Render } from "../render";
import { LayerGroup, FeatureLayer, Srs } from "../layers";
import { Constants } from "../shared";

export class GKMap {
    name = 'GKMap';
    srs: Srs;
    width: number;
    height: number;
    background?: string;
    maximumScale = Constants.POSITIVE_INFINITY_SCALE;
    minimumScale = 0;
    groups: Array<LayerGroup>;
    scales: Array<number>;

    constructor(width?: number, height?: number, srs?: string, scales?: Array<number>) {
        this.width = width || 256;
        this.height = height || 256;
        this.srs = new Srs(srs || 'EPSG:3857');
        this.groups = new Array<LayerGroup>();
        this.scales = new Array<number>();

        if (scales !== undefined) {
            scales.forEach(s => this.scales.push(s));
        } else {
            this.scales = Constants.DEFAULT_SCALES;
        }
    }

    toJSON() {
        const json: any = {
            name: this.name,
            srs: this.srs.toJSON(),
            width: this.width,
            height: this.height,
            maximumScale: this.maximumScale,
            minimumScale: this.minimumScale,
            groups: this.groups.map(g => g.toJSON())
        };

        if (this.background) {
            json.background = this.background;
        }

        return json;
    }

    static parseJSON(json: any) {
        const map = new GKMap();
        map.name = json.name;
        map.srs = Srs.parseJSON(json.srs);
        map.width = json.width;
        map.height = json.height;
        map.maximumScale = json.maximumScale;
        map.minimumScale = json.minimumScale;
        map.groups = (<any[]>json.groups).map(g => LayerGroup.parseJSON(g));
        if (json.background !== undefined) {
            map.background = json.background;
        }

        return map;
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