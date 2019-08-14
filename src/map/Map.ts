import _ from "lodash";
import { LayerGroup, FeatureLayer } from "../layers";
import { IEnvelope } from "ginkgoch-geom";
import { Render } from "../render";
import { Unit, GeoUtils } from "../shared";

export class Map {
    name = 'GKMap';
    srs?: string;
    srsUnit?: Unit;
    width: number;
    height: number;
    background?: string;
    maximumScale = Number.POSITIVE_INFINITY;
    minimumScale = 0;
    groups: Array<LayerGroup>;

    constructor(width?: number, height?: number, srs?: string) {
        this.width = width || 256;
        this.height = height || 256;
        this.srs = srs || 'EPSG:3857';
        this.groups = new Array<LayerGroup>();
    }

    pushLayers(layers: Array<FeatureLayer>, groupName: string = 'Default') {
        let group = this.groups.find(g => g.name === groupName);
        if (!group) {
            group = new LayerGroup([], groupName);
            this.groups.push(group);
        }

        group.pushAll(layers);
    }

    group(name: string): LayerGroup | undefined {
        return this.groups.find(g => g.name === name);
    }

    layer(name: string): FeatureLayer | undefined {
        return _.flatMap(this.groups, g => g.layers).find(l => l.name === name);
    }

    async draw(envelope: IEnvelope) {
        this.srsUnit = GeoUtils.unit(this.srs);
        const render = Render.create(this.width, this.height, envelope, this.srsUnit);
        for(let group of this.groups) {
            await group.draw(render);
        }

        render.flush();
        return render.image;
    }
}