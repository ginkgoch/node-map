import { FileStream } from "ginkgoch-shapefile/dist/shared/FileStream";
import { RTFile } from "./RTFile";
import { RTGeomType } from "./RTGeomType";
import { BufferReader, BufferWriter } from "ginkgoch-buffer-io";
import { RTRecordSetHeader } from "./RTRecordSetHeader";
import { Envelope } from "ginkgoch-geom";
import { RTRecord, RTEntry } from "./RTRecord";
import { RTConstants } from "./RTUtils";
import { RTSlot } from "./RTSlot";

export abstract class RTPage {
    public fileStream?: FileStream;
    public rtFile: RTFile;
    public pageNo: number = 0;
    public geomType: RTGeomType;
    public pageSize: number = 0;
    public isFloat: boolean;

    protected buff?: Buffer;
    protected isDirty = true;
    protected reader?: BufferReader;
    protected writer?: BufferWriter;

    constructor(rtFile: RTFile, geomType: RTGeomType, pageNo?: number) {
        this.rtFile = rtFile;
        this.geomType = geomType;
        this.fileStream = rtFile.fileStream();
        this.isFloat = rtFile.isFloat;

        if (pageNo) {
            this.pageNo = pageNo;
            this.load();
        }
    }

    load() {
        this.pageSize = this.rtFile.pageSize;
        this.buff = Buffer.alloc(this.pageSize);
        this.reader = new BufferReader(this.buff);
        this.writer = new BufferWriter(this.buff);
    }

    public flush() {
        if (this.fileStream === undefined || !this.isDirty) {
            return;
        }

        this.fileStream.seek(this.pageNo * this.pageSize);
        this.fileStream.write(this.buff!)
    }

    public close() {
        if (this.fileStream !== undefined) {
            this.fileStream.close();
        }
    }

    public dirty() {
        this.isDirty = true;
    }
}

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

export class RTDataPage extends RTPage {
    header = new RTPageHeader();
    recordSetHeader = new RTRecordSetHeader();
    cursor = 1;

    constructor(rtFile: RTFile, geomType: RTGeomType, pageNo?: number) {
        super(rtFile,  geomType, pageNo);

        if (pageNo === undefined) {
            this.initEmptyPage();
        }
        else {
            this.readPageHeader();
            this.readRecordSetHeader();
        }
    }

    public get level() {
        return this.recordSetHeader.level;
    }

    public set level(level: number) {
        this.recordSetHeader.level = level;
        this.writeRecordSetHeader();
    }

    public set pageNo(pageNo: number) {
        this.header.pageId = pageNo;
        this.pageNo = pageNo;
        this.writePageHeader();
    }

    public get recordCount() {
        const count = this.header.recordCount - RTConstants.RECORDSET_HEADER_CORRECTION;
        return count;
    }

    public get firstRecord(): RTRecord | null {
        return null
    }

    public get nextRecord(): RTRecord | null {
        return null;
    }

    public get eof(): boolean {
        const recordCount = this.recordCount;
        if (recordCount === 0) {
            return true;
        }
        if (this.cursor === recordCount) {
            return true;
        }
        else {
            return false;
        }
    }

    public get envelope() {
        return new Envelope(0, 0, 0, 0);
    }

    public get freePageNo() {
        const pageNo = this.fileStream!.total / this.pageSize;
        return pageNo;
    }

    public record(id: number): RTRecord | null {
        return null;
    }

    public maxRecordCount() {
        return 0;
    }
 
    public insertRecord(record: RTRecord) { }

    public deleteRecord(id: number) { }

    /**@override */
    public flush() {
        if (this.pageNo === 0) {
            throw 'Data page number cannot be 0.'
        }

        super.flush();
    }

    public initEmptyPage() {
        this.pageSize = this.rtFile.pageSize;
        this.buff = Buffer.alloc(this.pageSize);
        this.reader = new BufferReader(this.buff);
        this.writer = new BufferWriter(this.buff);

        const slotSize = RTConstants.PAGE_SLOT_SIZE;
        const pageHeaderSize = RTConstants.PAGE_HEADER_SIZE;
        this.recordSetHeader.root = 1;
        this.recordSetHeader.level = 1;
        this.header.recordCount = 1;
        this.header.pageId = this.pageNo;
        this.header.endDataOffset = RTConstants.RECORDSET_HEADER_SIZE;
        this.header.pageFreeSpace = this.pageSize - pageHeaderSize -  this.header.endDataOffset - slotSize * 2;
        this.header.placeholder = RTConstants.PAGE_HEADER_PLACEHOLDER;

        this.writer.seek(0);
        this.header.write(this.writer);
        this.recordSetHeader.write(this.writer);

        this.writer.seek(slotSize * 2, 'end');

        const slot = new RTSlot();
        slot.write(this.writer);
        this.writer.seek(slotSize * 2, 'end');
        slot.offset = 0;
        slot.length = RTConstants.RECORDSET_HEADER_SIZE;
        slot.write(this.writer);

        this.isDirty = true;
    }

    public readRecordSetHeader() {
        this.reader!.seek(RTConstants.PAGE_HEADER_SIZE);
        this.recordSetHeader.read(this.reader!);
    }

    public writeRecordSetHeader() {
        this.writer!.seek(RTConstants.PAGE_HEADER_SIZE, 'begin');
        this.recordSetHeader.write(this.writer!);
    }

    public readPageHeader() {
        this.reader!.seek(0);
        this.header.read(this.reader!);
    }

    public writePageHeader() {
        this.writer!.seek(0);
        this.header.write(this.writer!);
        this.isDirty = true;
    }

    public updateEntry(entry: RTEntry, id: number) { }
}