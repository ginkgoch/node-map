import _ from "lodash";
import { IEnvelope, Envelope, Point, Geometry, Feature } from "ginkgoch-geom";
import { Render } from "../render";
import { LayerGroup, FeatureLayer, Srs, Projection } from "../layers";
import { Constants, GeoUtils, Validator } from "../shared";
import { TileOrigin, TileSystem } from ".";

export class MapEngine {
    name = 'Map';
    srs: Srs;
    width: number;
    height: number;
    background?: string;
    maximumScale = Constants.POSITIVE_INFINITY_SCALE;
    minimumScale = 0;
    groups: Array<LayerGroup>;
    scales: Array<number>;
    origin: TileOrigin = 'upperLeft';

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
            origin: this.origin,
            maximumScale: this.maximumScale,
            minimumScale: this.minimumScale,
            scales: this.scales,
            groups: this.groups.map(g => g.toJSON())
        };

        if (this.background) {
            json.background = this.background;
        }

        return json;
    }

    static parseJSON(json: any) {
        const map = new MapEngine();
        map.name = this._default('name', json, map);
        map.srs = this._default('srs', json, map, Srs.parseJSON);
        map.width = this._default('width', json, map);
        map.height = this._default('height', json, map);
        map.origin = this._default('origin', json, map);
        map.maximumScale = this._default('maximumScale', json, map);
        map.minimumScale = this._default('minimumScale', json, map);
        map.background = this._default('background', json, map);
        map.scales = this._default('scales', json, map);
        map.groups = this._default('groups', json, map, groupsJson => {
            return (<any[]>groupsJson).map(g => LayerGroup.parseJSON(g));
        });
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

    pushLayer(layer: FeatureLayer, groupName: string = 'Default') {
        let group = this._groupOrNew(groupName);
        group.push(layer);
    }

    pushLayers(layers: Array<FeatureLayer>, groupName: string = 'Default') {
        let group = this._groupOrNew(groupName);
        group.pushAll(layers);
    }

    pushGroups(...groups: Array<LayerGroup>) {
        for (let group of groups) {
            this.groups.push(group);
        }
    }

    private _groupOrNew(name: string) {
        let group = this.groups.find(g => g.name === name);
        if (!group) {
            group = new LayerGroup([], name);
            this.groups.push(group);
        }

        return group;
    }

    group(name: string): LayerGroup | undefined {
        return this.groups.find(g => g.name === name);
    }

    layer(name: string, groupName?: string): FeatureLayer | undefined {
        if (groupName === undefined) {
            return _.flatMap(this.groups, g => g.layers).find(l => l.name === name);
        }

        const group = this.group(groupName);
        return group ? group.layers.find(l => l.name === name) : undefined;
    }

    layerByID(id: string): FeatureLayer | undefined {
        return _.flatMap(this.groups, g => g.layers).find(l => l.id === id);
    }

    /**
     * 
     * @param geom Geometry to find intersection.
     * @param geomSrs Geometry srs to find intersection.
     * @param zoomLevel Zoom level number. Starts from 0.
     * @param pointTolerance Tolerance for point geometry.
     * @returns {Array<{layerID:string, features: Feature[]}>} The intersected features that are categorized by layers.
     */
    async intersection(geom: Geometry, geomSrs: string, zoomLevel: number, pointTolerance: number = 10) {
        Validator.checkSrsIsValid(this.srs);

        const projection = new Projection(geomSrs, this.srs.projection);
        const geomProjected = projection.forward(geom);
        let envelope = geomProjected.envelope();
        if (geomProjected instanceof Point) {
            const scale = this.scales[zoomLevel];
            const resolution = GeoUtils.resolution(scale, this.srs.unit);
            const worldTolerance = resolution * pointTolerance;
            envelope.minx = geomProjected.x - worldTolerance;
            envelope.maxx = geomProjected.x + worldTolerance;
            envelope.miny = geomProjected.y - worldTolerance;
            envelope.maxy = geomProjected.y + worldTolerance;
        }

        const layers = _.flatMap(this.groups, g => g.layers);
        const intersectedFeatures: Array<{ layer: string, features: Feature[] }> = [];
        for (let layer of layers) {
            try {
                await layer.open();
                const features = await layer.source.features(envelope);
                if (features.length > 0) {
                    intersectedFeatures.push({
                        layer: layer.id,
                        features
                    });
                }
            }
            catch (ex) {
                console.log(ex);
            }
            finally {
                await layer.close();
            }
        }

        return intersectedFeatures;
    }

    /**
     * @deprecated This method is deprecated. Please call image(envelope?: IEnvelope) instead.
     */
    async draw(envelope?: IEnvelope) {
        return await this.image(envelope);
    }

    async image(envelope?: IEnvelope) {
        if (!envelope) {
            envelope = await this.envelope();
        }

        const render = Render.create(this.width, this.height, envelope, this.srs!.unit);
        for (let group of this.groups) {
            if (!group.visible) {
                continue;
            }

            await group.draw(render);
        }

        render.flush();
        return render.image;
    }

    async xyz(x: number = 0, y: number = 0, z: number = 0) {
        const tileSystem = new TileSystem(this.width, this.height, this.srs.unit, this.scales, this.origin);
        const envelope = tileSystem.envelope(z, x, y);
        const image = await this.image(envelope);
        return image;
    }

    private static _default(key: string, json: any, map: MapEngine, parser?: (param: any) => any) {
        let v = (<any>map)[key];

        let jsonValue = json[key];
        if (jsonValue) {
            v = parser ? parser(jsonValue) : jsonValue;
        }

        return v;
    }
}