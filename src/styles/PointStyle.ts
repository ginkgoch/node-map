import { Style } from "./Style";
import { StyleUtils } from "./StyleUtils";
import _ from "lodash";
import { IFeature } from "ginkgoch-geom";
import { Render } from "../render";

export class PointStyle extends Style {
    fillStyle: string;
    strokeStyle: string;
    lineWidth: number;
    radius: number;
    symbol: 'default' | 'rect' | 'square' | 'circle' = 'default';

    constructor(fillStyle?: string, 
        strokeStyle?: string, 
        lineWidth: number = 2, 
        radius: number = 12, 
        symbol: 'default' | 'rect' | 'square' | 'circle' = 'default') {

        super();

        this.name = 'Point Style';
        this.fillStyle = _.defaultTo(fillStyle, StyleUtils.colorOrRandomLight());
        this.strokeStyle = _.defaultTo(strokeStyle, StyleUtils.colorOrRandomDark());
        this.lineWidth = lineWidth;
        this.radius = radius;
        this.symbol = symbol;
    }
}