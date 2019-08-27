import { BufferReader, BufferWriter } from "ginkgoch-buffer-io";

export class RTSlot {
    offset: number = 0;
    length: number = 0;

    read(reader: BufferReader) {
        this.offset = reader.nextUInt16();
        this.length = reader.nextUInt16();
    }

    write(writer: BufferWriter) {
        writer.writeUInt16(this.offset);
        writer.writeUInt16(this.length);
    }
}