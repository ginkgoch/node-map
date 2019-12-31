import _ from "lodash";
import { IEnvelope, Envelope, Point, Geometry, Feature, GeometryFactory } from "ginkgoch-geom";
import { Render, Image } from "../render";
import { LayerGroup, FeatureLayer, Srs, Projection } from "../layers";
import { Constants, GeoUtils, Validator } from "../shared";
import { TileOrigin, TileSystem } from ".";

/**
 * This class represents a complete structure of a map instance. 
 * It wraps necessary information that are used for a map rendering.
 * 
 * @example A complete demo to create a map and draw as an image, then save to disk.
 * 
 * const source = new ShapefileFeatureSource('./tests/data/layers/USStates.shp');
 * const layer = new FeatureLayer(source);
 * layer.pushStyles([new FillStyle('yellow', 'blue', 1)]);
 * const map = new MapEngine(512, 256);
 * 
 * const image = map.draw();
 * 
 * fs.writeFileSync('demo.png', image.buffer);
 */
export class MapEngine {
    /**
     * The name of map.
     */
    name = 'Map';
    /**
     * This map's spatial reference system. It applies as the target SRS to each feature source.
     */
    srs: Srs;
    /**
     * The width of this map
     */
    width: number;
    /**
     * The height of this map.
     */
    height: number;
    /**
     * The background color. Default to undefined which means transparent background.
     */
    background?: string;
    /**
     * The maximum visible scale. Defaults to positive infinity.
     */
    maximumScale = Constants.POSITIVE_INFINITY_SCALE;
    /**
     * The minimum visible scale. Default to 0.
     */
    minimumScale = 0;
    /** 
     * The layer groups that maintains the layers inside for rendering.
     */
    groups: Array<LayerGroup>;
    /**
     * The scales list for defining the zoom levels for rendering.
     */
    scales: Array<number>;
    /**
     * Indicates the tile origin for calculating the tile system. Default is calculating from the upper left corner. 
     * 
     * Some tiling system is calculating from lower right corner, this is the property to set.
     */
    origin: TileOrigin = 'upperLeft';

    /**
     * Constructs a map engine instance.
     * @param {number} width The width of map. Optional with default value 256 px. 
     * @param {number} height The height of map. Optional with default value 256 px. 
     * @param {Srs} srs The spatial reference system of this map. Optional with default value `EPSG:3857`.
     * @param {Array<number>} scales The scale list that represents the zoom levels for map rendering.
     */
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

    /**
     * Converts this map instance into a JSON format data.
     * @returns {any} A JSON format data that is converted from this map engine.
     */
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

    /**
     * Parses the map instance from a specified JSON format data. 
     * The JSON data must match the map engine schema, otherwise, it throws exception.
     * @param {any} json The JSON format data that matches the map engine schema.
     * @returns {MapEngine} The map engine instance that is parsed from the JSON format data.
     */
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

    /**
     * Gets the envelope of this map. It unions all the layers inside and returns a minimum envelope that includes all the visible layers.
     * @returns {Envelope} The envelope of this map.
     */
    async envelope() {
        const envelopes = new Array<IEnvelope>();
        for (let group of this.groups) {
            envelopes.push(await group.envelope());
        }
        let envelope = Envelope.unionAll(envelopes);
        return envelope;
    }

    /**
     * This is a shortcut function for simply pushing a layer into a group. If the group doesn't exist, it automatically creates a new group to reserve the layer.
     * 
     * @param {FeatureLayer} layer The layer to push into this map.
     * @param {string} groupName The group name to reserve the layer. If there is no group matches the specific group name, a new group will be pushed into the map. Optional with default value `Default`.
     */
    pushLayer(layer: FeatureLayer, groupName: string = 'Default') {
        let group = this._groupOrNew(groupName);
        group.push(layer);
    }

    /**
     * This is a shortcut function for simply pushing layers into a group. If the group doesn't exist, it automatically creates a new group to reserve the layer.
     * 
     * @param {Array<FeatureLayer>} layers The layers to push into this map.
     * @param {string} groupName The group name to reserve the layer. If there is no group matches the specific group name, a new group will be pushed into the map. Optional with default value `Default`.
     */
    pushLayers(layers: Array<FeatureLayer>, groupName: string = 'Default') {
        let group = this._groupOrNew(groupName);
        group.pushAll(layers);
    }

    /**
     * Pushes multiple groups into map.
     * @param {...Array<LayerGroup>} groups The groups to push into this map.
     */
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

    /**
     * A shortcut function to look for a group by name.
     * @param {string} name The group name.
     * @returns {LayerGroup|undefined} The layer group that matches the name. If not found, returns undefined.
     */
    group(name: string): LayerGroup | undefined {
        return this.groups.find(g => g.name === name);
    }

    /**
     * A shortcut function to look for a layer by name through all groups. If the group name is defined, it only looks for the layer from the group.
     * @param {string} name The layer name to look for.
     * @param {string} groupName The group name where the layer is looking for.
     * @returns {FeatureLayer|undefined} The layer that matches the name. If not found, returns undefined.
     */
    layer(name: string, groupName?: string): FeatureLayer | undefined {
        if (groupName === undefined) {
            return _.flatMap(this.groups, g => g.layers).find(l => l.name === name);
        }

        const group = this.group(groupName);
        return group ? group.layers.find(l => l.name === name) : undefined;
    }

    /**
     * A shortcut function to look for a layer by id through all groups. 
     * @param {string} id The identity of a layer.
     * @returns {FeatureLayer|undefined} The layer that matches the name. If not found, returns undefined.
     */
    layerByID(id: string): FeatureLayer | undefined {
        return _.flatMap(this.groups, g => g.layers).find(l => l.id === id);
    }

    /**
     * Query features through all feature layers with spatial relationship - intersection.
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
                let features = await layer.source.features(envelope);
                const testPolygon = GeometryFactory.envelopeAsPolygon(envelope);
                features = features.filter(f => f.geometry.intersects(testPolygon));
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

    /**
     * Gets an image of this map instance.
     * @param {IEnvelope} envelope The envelope that the viewport will be rendered. Optional with the minimal envelope of this map.
     * @returns {Image} The image that is rendered with this map instance.
     */
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

    /**
     * This is a shortcut function to render this map instance with XYZ tiling system.
     * 
     * NOTE: XYZ rendering requires some other settings, it is automatically reflected to the properties on this map instance. e.g.
     * 
     * tile width -> map.width
     * tile height -> map.height
     * tile zoom levels -> map.scales
     * tile origin -> map.origin
     * ...
     * 
     * @param {number} x The column number. Start from 0.
     * @param {number} y The row number. Start from 0.
     * @param {number} z The zoom level number. Start from 0.
     */
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