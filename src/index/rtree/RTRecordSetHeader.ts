import { FileStream } from "ginkgoch-shapefile/dist/shared/FileStream";
import { StreamUtils } from "./RTUtils";
import { BufferReader, BufferWriter } from "ginkgoch-buffer-io";

export class RTRecordSetHeader {
    root = 0;
    level = 0;
    placeholder = 0;

    read(reader: BufferReader) {
        this.root = reader.nextUInt32();
        this.level = reader.nextUInt16();
        this.placeholder = reader.nextUInt16();
    }

    write(writer: BufferWriter) {
        writer.writeUInt32(this.root);
        writer.writeUInt16(this.level);
        writer.writeUInt16(this.placeholder);
    }
}