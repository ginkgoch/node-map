import { FileStream } from "ginkgoch-shapefile/dist/shared/FileStream";
import { StreamUtils } from "./RTUtils";

export class RTPageHeader {
    pageId = 0;
    pageFreeSpace = 0;
    endDataOffset = 0;
    recordCount = 0;
    vacantRecordCount = 0;
    placeholder = 0x0F0F0F0F;

    public init() {
        this.pageId = 0;
        this.pageFreeSpace = 0;
        this.endDataOffset = 0;
        this.recordCount = 0;
        this.vacantRecordCount = 0;
        this.placeholder = 0x0F0F0F0F;
    }

    public read(stream: FileStream) {
        this.init();

        this.pageId = StreamUtils.readUInt32(stream);
        this.pageFreeSpace = StreamUtils.readUInt16(stream);
        this.endDataOffset = StreamUtils.readUInt16(stream);
        this.recordCount = StreamUtils.readUInt16(stream);
        this.vacantRecordCount = StreamUtils.readUInt16(stream);
        this.placeholder = StreamUtils.readUInt32(stream);
    }

    public write(stream: FileStream) {
        StreamUtils.writeUInt32(stream, this.pageId);
        StreamUtils.writeUInt16(stream, this.pageFreeSpace);
        StreamUtils.writeUInt16(stream, this.endDataOffset);
        StreamUtils.writeUInt16(stream, this.recordCount);
        StreamUtils.writeUInt16(stream, this.vacantRecordCount);
        StreamUtils.writeUInt32(stream, this.placeholder);
    }
}