import { FileStream } from "ginkgoch-shapefile/dist/shared/FileStream";
import { StreamUtils } from "./RTUtils";

export class RTRecordSetHeader {
    root = 0;
    level = 0;
    placeholder = 0;

    read(stream: FileStream) {
        this.root = StreamUtils.readUInt32(stream);
        this.level = StreamUtils.readUInt16(stream);
        this.placeholder = StreamUtils.readUInt16(stream);
    }

    write(stream: FileStream) {
        StreamUtils.writeUInt32(stream, this.root);
        StreamUtils.writeUInt16(stream, this.level);
        StreamUtils.writeUInt16(stream, this.placeholder);
    }
}