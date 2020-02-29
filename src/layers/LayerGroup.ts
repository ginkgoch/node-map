import _ from 'lodash';
import { Envelope, IEnvelope } from "ginkgoch-geom";
import { FeatureLayer } from ".";
import { Render } from "../render";
import { JSONKnownTypes } from "../shared";
import uuid from "../shared/UUID";

/**
 * This class represents a collection of a layers. It is used for organize the layer better in the app implementation.
 * 
 * For instance, we usually have a set of layers that are stable and not change very often; 
 * while another set of layers are stored in memory and change very often, just like dynamic editing or highlighting features.
 * Then we could maintain the two sets of layers in two LayerGroup; then it is easier to manage their rendering or caching.
 * 
 * @category layer
 */
export class LayerGroup {
    /**
     * ID of this group. Default value is `group-${uuid()}`.
     */
    id: string;
    /**
     * Name of this group. Default value is `Unknown`.
     */
    name: string;
    /**
     * Indicates whether this group is visible or not.
     */
    visible: boolean = true;
    /**
     * The FeatureLayer array.
     */
    layers: Array<FeatureLayer>;

    /**
     * Constructs an instance of LayerGroup.
     * @param {Array<FeatureLayer>} layers The layers that are about to add into this group. Pass `undefined` to initiate an empty array.
     * @param {string} name The name of this group.
     */
    constructor(layers?: Array<FeatureLayer>, name: string = 'Unknown') {
        this.id = 'group-' + uuid();
        this.name = name;
        this.layers = new Array<FeatureLayer>();
        layers && layers.forEach(layer => this.layers.push(layer));
    }

    /**
     * Gets the envelope of this group. 
     * This function unions the envelope of each layers as a minimum envelope to contains all layers.
     * @returns {Envelope} A minimum envelope to contains all the layers inside.
     */
    async envelope(): Promise<Envelope> {
        const envelopes = new Array<Envelope>();
        for (let layer of this.layers) {
            await layer.open();
            const envelope = await layer.envelope();
            envelopes.push(envelope);
        }

        return Envelope.unionAll(envelopes);
    }

    /**
     * Pushes new feature layer into this group.
     * @param {FeatureLayer} layer The new feature layer to push into this group.
     */
    push(layer: FeatureLayer): void {
        this.layers.push(layer);
    }

    /**
     * Pushes all feature layers into this group.
     * @param {Array<FeatureLayer>} layers The new feature layers to push into this group.
     */
    pushAll(layers: Array<FeatureLayer>) {
        layers.forEach(l => this.layers.push(l));
    }

    /**
     * Draws all layers in this group.
     * @param {Render} render The renderer to draw this group.
     */
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

    /**
     * A shortcut to find a layer by name. 
     * It looks for all layers and returns the first layer whose name is equal to the specified name.
     * @param {string} name The layer name that is looking for.
     * @returns {FeatureLayer|undefined} A layer instance whose name is equal to the specified name. 
     * Returns `undefined` when no layer found.
     */
    layer(name: string): FeatureLayer | undefined {
        return this.layers.find(l => l.name === name);
    }

    /**
     * Converts current layer into a JSON format data.
     * @returns {any} A JSON format data that reflects this group.
     */
    toJSON(): any {
        return this._toJSON();
    }

    /**
     * Converts current layer into a JSON format data.
     * @returns {any} A JSON format data that reflects this group.
     * 
     */
    protected _toJSON(): any {
        return {
            type: JSONKnownTypes.layerGroup,
            name: this.name,
            visible: this.visible,
            layers: this.layers.map(layer => layer.toJSON())
        };
    }

    /**
     * Parses JSON format data into a LayerGroup instance.
     * @param {any} json JSON format data that matches `LayerGroup` schema.
     * @returns {LayerGroup} A `LayerGroup` instance that is converted from the specified JSON format data.
     */
    static parseJSON(json: any) {
        const group = new LayerGroup();
        group.name = _.defaultTo(json.name, 'Unknown');
        group.visible = _.defaultTo(json.visible, true);
        group.layers = (<any[]>json.layers).map(j => {
            return FeatureLayer.parseJSON(j);
        });

        return group;
    }
}