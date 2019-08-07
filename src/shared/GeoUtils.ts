import proj4 from 'proj4';
import { Unit } from './Unit';
import { IEnvelope } from 'ginkgoch-geom';
import { Size } from '../render';

const INCH_PER_MT = 39.3701;
const INCH_PER_FT = 12;
const INCH_PER_DD = 4374754;
const DPI = 96;

export class GeoUtils {
    static scale(envelope: IEnvelope, envelopeUnit: Unit, viewportSize: Size, dpi = DPI) {
        const inchPerUnit = GeoUtils.inchPerUnit(envelopeUnit);
        const scaleX = Math.abs(envelope.maxx - envelope.minx) * inchPerUnit * dpi / viewportSize.width;
        const scaleY = Math.abs(envelope.maxy - envelope.miny) * inchPerUnit * dpi / viewportSize.height;
        return Math.max(scaleX, scaleY);
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