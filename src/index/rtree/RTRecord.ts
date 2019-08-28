import { RTConstants, RTUtils } from "./RTUtils";
import { Envelope, IEnvelope } from "ginkgoch-geom";
import { BufferReader, BufferWriter } from "ginkgoch-buffer-io";
import { RTGeomType } from "./RTGeomType";

export class RTRecordHeader {
    keyLength = 0;
    elementLength = 0;
    childNodeId = 0;

    read(reader: BufferReader) {
        this.keyLength = reader.nextUInt16();
        this.elementLength = reader.nextUInt16();
        this.childNodeId = reader.nextUInt32();
    }

    write(writer: BufferWriter) {
        writer.writeUInt16(this.keyLength);
        writer.writeUInt16(this.elementLength);
        writer.writeUInt32(this.childNodeId);
    }
}

export abstract class RTRecord {
    public data = 0;
    public header = new RTRecordHeader();

    child() {
        return this.header.childNodeId;
    }

    abstract envelope(): RTRectangle;

    point() {
        return new RTPoint();
    }

    abstract read(reader: BufferReader, float: boolean): void;
    abstract write(writer: BufferWriter, float: boolean): void;
    abstract isContained(envelope: IEnvelope): boolean;
    abstract contains(envelope: IEnvelope): boolean;
    abstract overlaps(envelope: IEnvelope): boolean;
    abstract size(float: boolean): number;
    abstract area(): number;

    static create(geomType: RTGeomType): RTRecord {
        switch (geomType) {
            case RTGeomType.point:
                return new RTPointRecord();
            case RTGeomType.rectangle:
                return new RTRectangleRecord();
        }

        throw new Error('not supported record type.')
    }
}

export class RTPointRecord extends RTRecord {
    _point: RTPoint = new RTPoint();
    header = new RTRecordHeader();
    data = 0;

    constructor(recordHeader?: RTRecordHeader, point?: RTPoint, id?: number) {
        super();

        this.header = recordHeader || this.header;
        this._point = point || this._point;
        this.data = id || 0;
    }

    point() {
        return this._point;
    }

    read(reader: BufferReader, float: boolean) {
        this.header.read(reader);
        this._point.read(reader, float);
        this.data = reader.nextUInt32();
    }

    write(writer: BufferWriter, float: boolean) {
        this.header.write(writer);
        this._point.write(writer, float);
        writer.writeUInt32(this.data);
        writer.writeUInt32(RTConstants.PAGE_HEADER_PLACEHOLDER);
    }

    envelope(): RTRectangle {
        return new RTRectangle(this._point.x, this._point.y, this._point.x, this._point.y);
    }

    area() {
        return 0;
    }

    size(float: boolean): number {
        const size = RTConstants.RECORD_HEADER_SIZE + 
            RTUtils.sizeOfPoint(float) + 
            RTConstants.RECORD_DATA_LENGTH + 
            RTConstants.RECORD_ALIGNED;
        return size;
    }

    isContained(envelope: IEnvelope): boolean {
        const rt1 = this.envelope();
        return Envelope.contains(envelope, rt1);
    }

    contains(envelope: IEnvelope): boolean {
        return false;
    }

    overlaps(envelope: IEnvelope): boolean {
        return this.isContained(envelope);
    }
}

export class RTRectangleRecord extends RTRecord {
    id = 0;
    header = new RTRecordHeader();
    rect = new RTRectangle(0, 0, 0, 0);

    constructor(recordHeader?: RTRecordHeader, rect?: RTRectangle, id?: number) {
        super();

        this.header = recordHeader || this.header;
        this.rect = rect || this.rect;
        this.data = id || 0;
    }

    envelope(): RTRectangle {
        return this.rect;
    }

    get rectangle() {
        return this.rect;
    }

    set rectangle(rect: RTRectangle) {
        this.rect = rect;
    }

    read(reader: BufferReader, float: boolean): void {
        this.header.read(reader);
        this.rect.read(reader, float);
        this.data = reader.nextUInt32();

        const placeholder = reader.nextUInt32();
        if (placeholder !== RTConstants.PAGE_HEADER_PLACEHOLDER) {
            throw new Error('I/O not matched.');
        }
    }

    write(writer: BufferWriter, float: boolean): void {
        this.header.write(writer);
        this.rect.write(writer, float);
        writer.writeUInt32(this.data);
        writer.writeUInt32(RTConstants.PAGE_HEADER_PLACEHOLDER);
    }

    isContained(envelope: IEnvelope): boolean {
        return Envelope.contains(envelope, this.rect);
    }

    contains(envelope: IEnvelope): boolean {
        return Envelope.contains(this.rect, envelope);
    }

    overlaps(envelope: IEnvelope): boolean {
        return Envelope.overlaps(this.rect, envelope);
    }

    size(float: boolean): number {
        const size = RTConstants.RECORD_HEADER_SIZE + 
            RTUtils.sizeOfRectangle(float) +
            RTConstants.RECORD_ALIGNED + 
            RTConstants.RECORD_DATA_LENGTH;
        return size; 
    }

    area(): number {
        return this.rect.area();
    }
}

export class RTEntryRecord extends RTRectangleRecord {
    constructor(recordHeader?: RTRecordHeader, rect?: RTRectangle) {
        recordHeader = recordHeader || new RTRecordHeader();
        rect = rect || new RTRectangle(0, 0, 0, 0);
        super(recordHeader, rect, 0);
    }

    size(float: boolean): number {
        return RTConstants.RECORDSET_HEADER_SIZE + RTUtils.sizeOfRectangle(float);
    }

    read(reader: BufferReader, float: boolean) {
        this.header.read(reader);
        this.rect.read(reader, float);
    }

    write(writer: BufferWriter, float: boolean) {
        this.header.write(writer);
        this.rect.write(writer, float);
    }
}

//#region rect and point
export class RTPoint {
    x = 0;
    y = 0;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    equals(pt: RTPoint) {
        return this.x === pt.x && this.y === pt.y;
    }

    read(reader: BufferReader, float: boolean) {
        if (float) {
            this.x = reader.nextFloat();
            this.y = reader.nextFloat();
        }
        else {
            this.x = reader.nextDouble();
            this.y = reader.nextDouble();
        }
    }

    write(writer: BufferWriter, float: boolean) {
        if (float) {
            writer.writeFloat(this.x);
            writer.writeFloat(this.y);
        }
        else {
            writer.writeDouble(this.x);
            writer.writeDouble(this.y);
        }
    }
}

export class RTRectangle extends Envelope {
    constructor(minx: number, miny: number, maxx: number, maxy: number) {
        super(minx, miny, maxx, maxy);
    }

    read(reader: BufferReader, float: boolean) {
        const nextValue = float ? reader.nextFloat : reader.nextDouble;

        this.minx = nextValue();
        this.miny = nextValue();
        this.maxx = nextValue();
        this.maxy = nextValue();
    }

    write(writer: BufferWriter, float: boolean) {
        const writeValue = float ? writer.writeFloat : writer.writeDouble;
        writeValue(this.minx);
        writeValue(this.miny);
        writeValue(this.maxx);
        writeValue(this.maxy);
    }

    expandedArea(rect: RTRectangle) {
        const expandedRect = Envelope.union(this, rect);
        return expandedRect.area();
    }

    minDistanceTo(p: RTPoint) {
        if (p.x < this.minx && p.y > this.maxy) {
            return this.distance(this.minx - p.x, p.y - this.maxy);
        }
        if (p.x > this.maxx && p.y > this.maxy) {
            return this.distance(p.x - this.maxx, p.y - this.maxy);
        }
        if (p.x > this.maxx && p.y < this.miny) {
            return this.distance(p.x - this.maxx, this.miny - p.y);
        }
        if (p.x < this.minx && p.y < this.miny) {
            return this.distance(this.minx - p.x, this.miny - p.y);
        }
        if (p.x < this.minx || p.x > this.maxx) {
            return Math.min(Math.abs(this.minx - p.x), Math.abs(p.x - this.maxx));
        }
        if (p.y < this.miny || p.y > this.maxy) {
            return Math.min(Math.abs(this.miny - p.y), Math.abs(p.y - this.maxy));
        }

        return 0;
    }

    contains(point: RTPoint) {
        let result = true;
        if ((point.x < this.minx || point.x > this.maxx) && (point.y < this.miny || point.y > this.maxy)) {
            result = false;
        }

        return result;
    }

    private distance(h: number, w: number) {
        return Math.sqrt(Math.pow(w, 2) + Math.pow(h, 2));
    }
}
//#endregion