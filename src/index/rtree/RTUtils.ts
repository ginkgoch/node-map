import { FileStream } from "ginkgoch-shapefile/dist/shared/FileStream";

const defaultEncoding: 'utf-8' = 'utf-8';

export let RTConstants = Object.freeze({
    ALIGNED_SLOT_COUNT: 2,
    RECORD_ALIGNED: 4,
    RECORD_DATA_LENGTH: 4,
    ACCURACY_TOLERANCE: 1e6,
    PAGE_HEADER_SIZE: 16,
    RECORD_SET_HEADER_SIZE: 8,
    RECORD_HEADER_SIZE: 8,
    PAGE_SLOT_SIZE: 4,
    MAGIC_CHAR_LENGTH: 15,
    POINT_EXT_LENGTH: 13,
    RECT_EXT_LENGTH: 12,
    DEFAULT_ENCODING: defaultEncoding,
    RECORDSET_HEADER_CORRECTION: 1
});

export class RTUtils {
    static notImplemented() {
        throw new Error('not implemented.');
    }

    static size(float = false) {
        return float ? 8 : 16;
    }
}

export class NotImplementedError extends Error {

}

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