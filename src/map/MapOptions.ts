import { Constants } from "../shared";

export interface MapOptions {
    width?: number;
    height?: number;
    crs?: string;
    scales?: Array<number>;
}

export let LeafletMapOptions = {
    DEFAULT: {
        width: 256,
        height: 256,
        crs: 'EPSG:3857',
        scales: Constants.DEFAULT_SCALES
    },
    WGS84: {
        width: 256,
        height: 256,
        crs: 'EPSG:4326',
        scales: Constants.DEFAULT_SCALES_WGS84
    }
}