import { FileStream } from "ginkgoch-filestream";
import { RTRectangle } from "./RTRecord";
import { Envelope } from "ginkgoch-geom";
import { RTRecordType } from "./RTRecordType";

const defaultEncoding: 'utf-8' = 'utf-8';

/** @ignore */
export let RTConstants = Object.freeze({
    ALIGNED_SLOT_COUNT: 2,
    RECORD_ALIGNED: 4,
    RECORD_DATA_LENGTH: 4,
    ACCURACY_TOLERANCE: 1e6,
    PAGE_HEADER_SIZE: 16,
    PAGE_HEADER_PLACEHOLDER: 0x0F0F0F0F,
    RECORD_HEADER_SIZE: 8,
    PAGE_SLOT_SIZE: 4,
    MAGIC_CHAR_LENGTH: 15,
    POINT_EXT_LENGTH: 13,
    RECT_EXT_LENGTH: 12,
    DEFAULT_ENCODING: defaultEncoding,
    RECORDSET_HEADER_CORRECTION: 1,
    RECORDSET_HEADER_SIZE: 8,
    FILL_FACTOR: 0.5,
    RECORD_POINT_TYPE: 'RT_POINT_EXT\0',
    RECORD_RECT_TYPE: 'RT_RECT_EXT\0',
    KILOBYTES: 1024
});

/** @ignore */
export class RTUtils {
    static sizeOfRecordType(recordType: RTRecordType, float: boolean) {
        if (recordType === RTRecordType.point) {
            return this.sizeOfPoint(float);
        }
        else {
            return this.sizeOfRectangle(float);
        }
    }

    static sizeOfPoint(float = false) {
        return float ? 8 : 16;
    }

    static sizeOfRectangle(float: boolean) {
        return float ? 16 : 32;
    }

    static remove<T>(source: Array<T>, obj: T) {
        const index = source.findIndex(s => s === obj);
        if (index >= 0) {
            source.splice(index, 1);
        }
    }

    static unionArea(rect1: RTRectangle, rect2: RTRectangle): number {
        const unionRect = Envelope.union(rect1, rect2);
        return unionRect.area();
    }

    static kilobytes(k: number) {
        return k * RTConstants.KILOBYTES;
    }
}

/** @ignore */
export class StreamUtils {
    static readUInt16(stream: FileStream): number {
        const buff = stream.read(2);
        return buff.readUInt16LE(0);
    }

    static writeUInt16(stream: FileStream, value: number) {
        const buff = Buffer.alloc(2);
        buff.writeUInt16LE(value, 0);
        stream.write(buff);
    }

    static readUInt32(stream: FileStream) {
        const buff = stream.read(4);
        return buff.readUInt32LE(0);
    }

    static writeUInt32(stream: FileStream, value: number) {
        const buff = Buffer.alloc(4);
        buff.writeUInt32LE(value, 0);
        stream.write(buff);
    }

    static readByte(stream: FileStream): number {
        return stream.read(1)[0];
    }

    static writeByte(stream: FileStream, value: number) {
        const buff = Buffer.from([value]);
        stream.write(buff);
    }

    static writeString(stream: FileStream, str: string) {
        const buff = Buffer.from(str);
        stream.write(buff);
    }
}