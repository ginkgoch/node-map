import { FileStream } from "ginkgoch-shapefile/dist/shared/FileStream";
import { StreamUtils } from "./RTUtils";
import { Envelope } from "ginkgoch-geom";
import { BufferReader, BufferWriter } from "ginkgoch-buffer-io";

export class RTRecordHeader {
    keyLength = 0;
    elementLength = 0;
    childNodeId = 0;

    read(stream: FileStream) {
        this.keyLength = StreamUtils.readUInt16(stream);
        this.elementLength = StreamUtils.readUInt16(stream);
        this.childNodeId = StreamUtils.readUInt32(stream);
    }

    write(stream: FileStream) {
        StreamUtils.writeUInt16(stream, this.keyLength);
        StreamUtils.writeUInt16(stream, this.elementLength);
        StreamUtils.writeUInt32(stream, this.childNodeId);
    }
}

export abstract class RTRecord {
    public data = 0;
    public header = new RTRecordHeader();

    child() {
        return this.header.childNodeId;
    }

    abstract envelope(): Envelope;

    point() {
        return new RTPoint();
    }

    abstract read(reader: BufferReader, float: boolean): void;
    abstract write(writer: BufferWriter, float: boolean): void;
    abstract isContained(envelope: Envelope): boolean;
    abstract contains(envelope: Envelope): boolean;
    abstract overlaps(envelope: Envelope): boolean;
    abstract size(float: boolean): number;
    abstract area(): number;
}

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