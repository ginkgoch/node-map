import proj4 from 'proj4';
import { Unit } from './Unit';
import { IEnvelope } from 'ginkgoch-geom';
import { Size } from '../render';

const INCH_PER_MT = 39.3701;
const INCH_PER_FT = 12;
const INCH_PER_DD = 4374754;
const DPI = 96;
const DEFAULT_MAXIMUM_SCALE = 591659030.6768064;

export let Constants = {
    POSITIVE_INFINITY_SCALE: 1e10,
    DEFAULT_MAXIMUM_SCALE,
    DEFAULT_SCALES: (function (): Array<number> {
        const scales = new Array<number>();
        let currentScale = DEFAULT_MAXIMUM_SCALE;
        while (scales.length < 20) {
            scales.push(currentScale);
            currentScale *= 0.5;
        }

        return scales;
    })()
};

export class GeoUtils {
    static scale(envelope: IEnvelope, envelopeUnit: Unit, viewportSize: Size, dpi = DPI) {
        const inchPerUnit = GeoUtils.inchPerUnit(envelopeUnit);
        const scaleX = Math.abs(envelope.maxx - envelope.minx) * inchPerUnit * dpi / viewportSize.width;
        const scaleY = Math.abs(envelope.maxy - envelope.miny) * inchPerUnit * dpi / viewportSize.height;
        return Math.max(scaleX, scaleY);
    }

    static scaleLevel(scale: number, scales?: Array<number>) {
        scales = scales || Constants.DEFAULT_SCALES;
        if (scales.length === 0) {
            throw new Error('Scales must at least have one scale. Leave it undefined if you don\'t know how to set it.');
        }

        scales = scales.sort((n1, n2) => n2 - n1);
        if (scale > scales[0]) {
            return 0;
        }

        let tempLevel = -1;
        let tempScaleDiff = Number.MAX_VALUE;
        for (let i = scales.length - 1; i >= 0; i--) {
            let current = scales[i];
            let currentDiff = Math.abs(current - scale);
            if (tempScaleDiff > currentDiff) {
                tempScaleDiff = currentDiff;
                tempLevel = i;
            }
        }

        return tempLevel;
    }

    static unit(srs: string | undefined): Unit {
        if (srs === undefined) return Unit.unknown;

        try {
            const proj = proj4(srs) as any;
            const unit = proj.oProj.units;
            switch (unit) {
                case 'degrees': return Unit.degrees;
                case 'm': return Unit.meter;
                case 'us-ft': return Unit.feet;
                default: return Unit.unknown;
            }
        } catch {
            return Unit.unknown;
        }
    }

    static inchPerUnit(unit: Unit) {
        switch(unit) {
            case Unit.degrees: return INCH_PER_DD;
            case Unit.feet: return INCH_PER_FT;
            case Unit.meter: 
            default:
                return INCH_PER_MT;
        }
    }
}