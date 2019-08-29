import { FileStream } from "ginkgoch-filestream";
import { RTConstants, StreamUtils } from "./RTUtils";
import { BufferWriter } from "ginkgoch-buffer-io";

export class RTFileHeader {
    description: string = '';
    extId: number = 0;
    freePageId: number = 0;
    extName: string = '';
    pageSize: number = 0;
    isFloat: boolean = false;

    public init() {
        this.description = '';
        this.extId = 0;
        this.freePageId = 0;
        this.extName = '';
        this.pageSize = 0;
    }

    public read(stream: FileStream) {
        this.init();

        const descBuff = stream.read(RTConstants.MAGIC_CHAR_LENGTH);
        this.description = descBuff.toString(RTConstants.DEFAULT_ENCODING);
        this.extId = StreamUtils.readUInt32(stream);
        this.freePageId = StreamUtils.readUInt32(stream);
        if (this.extId === 0) {
            this.extName = stream.read(RTConstants.POINT_EXT_LENGTH).toString(RTConstants.DEFAULT_ENCODING);
        }
        else {
            this.extName = stream.read(RTConstants.RECT_EXT_LENGTH).toString(RTConstants.DEFAULT_ENCODING);
        }

        this.pageSize = StreamUtils.readUInt32(stream);
        this.isFloat = StreamUtils.readByte(stream) !== 0;
    }

    // public write(stream: FileStream) {
    //     const descBuff = Buffer.alloc(RTConstants.MAGIC_CHAR_LENGTH);
    //     descBuff.write(this.description, RTConstants.DEFAULT_ENCODING);
    //     stream.write(descBuff);
    //     StreamUtils.writeUInt32(stream, this.extId);
    //     StreamUtils.writeUInt32(stream, this.freePageId);
    //     StreamUtils.writeString(stream, this.extName);
    //     StreamUtils.writeUInt32(stream, this.pageSize);
    //     StreamUtils.writeByte(stream, this.isFloat ? 1 : 0);
    // }

    public write(writer: BufferWriter) {
        const descBuff = Buffer.alloc(RTConstants.MAGIC_CHAR_LENGTH);
        descBuff.write(this.description, RTConstants.DEFAULT_ENCODING);
        writer.writeBuffer(descBuff);
        writer.writeUInt32(this.extId);
        writer.writeUInt32(this.freePageId);
        writer.writeString(this.extName);
        writer.writeUInt32(this.pageSize);
        writer.writeUInt8(this.isFloat ? 1 : 0);
    }
}