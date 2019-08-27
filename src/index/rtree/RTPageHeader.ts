import { BufferReader, BufferWriter } from "ginkgoch-buffer-io";

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

    public read(reader: BufferReader) {
        this.init();

        this.pageId = reader.nextUInt32();
        this.pageFreeSpace = reader.nextUInt16();
        this.endDataOffset = reader.nextUInt16();
        this.recordCount = reader.nextUInt16();
        this.vacantRecordCount = reader.nextUInt16();
        this.placeholder = reader.nextUInt32();
    }

    public write(stream: BufferWriter) {
        stream.writeUInt32(this.pageId);
        stream.writeUInt16(this.pageFreeSpace);
        stream.writeUInt16(this.endDataOffset);
        stream.writeUInt16(this.recordCount);
        stream.writeUInt16(this.vacantRecordCount);
        stream.writeUInt32(this.placeholder);
    }
}