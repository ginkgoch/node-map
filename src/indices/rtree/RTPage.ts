import { FileStream } from "ginkgoch-filestream";
import { RTFile } from "./RTFile";
import { RTRecordType } from "./RTRecordType";
import { BufferReader, BufferWriter } from "ginkgoch-buffer-io";
import { Envelope } from "ginkgoch-geom";
import { RTRecord, RTEntryRecord, RTRectangle } from "./RTRecord";
import { RTConstants, StreamUtils } from "./RTUtils";

/** @ignore */
export abstract class RTPage {
    public fileStream?: FileStream;
    public rtFile: RTFile;
    public pageNo: number = 0;
    public recordType: RTRecordType;
    public pageSize: number = 0;
    public isFloat: boolean;

    protected buff?: Buffer;
    protected isDirty = true;
    protected reader?: BufferReader;
    protected writer?: BufferWriter;

    constructor(rtFile: RTFile, recordType: RTRecordType = RTRecordType.point, pageNo?: number) {
        this.rtFile = rtFile;
        this.recordType = recordType;
        this.fileStream = rtFile.fileStream;
        this.isFloat = rtFile.isFloat;

        if (pageNo !== undefined) {
            this.pageNo = pageNo;
            this.load();
        }
    }

    load() {
        this.pageSize = this.rtFile.pageSize;

        this.buff = Buffer.alloc(this.pageSize);
        this.fileStream!.seek(this.pageNo * this.pageSize);
        
        const currentPageBuff  = this.fileStream!.read(this.pageSize);
        currentPageBuff.copy(this.buff, 0, 0, currentPageBuff.length);

        this.reader = new BufferReader(this.buff);
        this.writer = new BufferWriter(this.buff);
    }

    public flush() {
        if (this.fileStream === undefined || !this.isDirty) {
            return;
        }

        this.fileStream.seek(this.pageNo * this.pageSize);
        this.fileStream.write(this.buff!)
        this.fileStream.invalidCache();
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

/** @ignore */
export class RTDataPage extends RTPage {
    header = new RTPageHeader();
    recordSetHeader = new RTRecordSetHeader();
    cursor = 1;

    constructor(rtFile: RTFile, recordType: RTRecordType, pageNo?: number) {
        super(rtFile, recordType, pageNo);

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

    public setPageNo(pageNo: number) {
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

    public envelope(): RTRectangle {
        return new RTRectangle(0, 0, 0, 0);
    }

    public get freePageNo() {
        const pageNo = this.fileStream!.total / this.pageSize;
        return pageNo;
    }

    public record(id: number): RTRecord | null {
        return null;
    }

    public capacity() {
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
        this.header.pageFreeSpace = this.pageSize - pageHeaderSize - this.header.endDataOffset - slotSize * 2;
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

    public updateEntry(entry: RTEntryRecord, id: number) { }
}

/** @ignore */
export class RTLeafPage extends RTDataPage {
    constructor(rtFile: RTFile, recordType: RTRecordType, pageNo?: number) {
        super(rtFile, recordType, pageNo);
    }

    public createRecord(): RTRecord {
        const record = RTRecord.create(this.recordType);
        return record;
    }

    record(id: number): RTRecord | null {
        const recordCount = this.recordCount;
        if (id < 0 || id > recordCount) {
            return null
        }
        
        id++;

        const slotPosition = (id + 2) * RTConstants.PAGE_SLOT_SIZE;
        this.reader!.seek(slotPosition, 'end');

        const slot = new RTSlot();
        slot.read(this.reader!);

        const recordPosition = slot.offset + RTConstants.PAGE_HEADER_SIZE;
        this.reader!.seek(recordPosition, 'begin');
        
        const record = this.createRecord();
        record.read(this.reader!, this.isFloat);
        return record;
    }
    
    get firstRecord(): RTRecord | null {
        this.cursor = 0;
        const record = this.record(this.cursor);
        
        this.cursor++;
        return record;
    }

    public get nextRecord(): RTRecord | null {
        let record: RTRecord | null = null;
        if (!this.eof) {
            record = this.record(this.cursor);
            this.cursor++;
        }
        return record;
    }

    public insertRecord(record: RTRecord) { 
        const tmpSize = record.size(this.isFloat) + RTConstants.PAGE_SLOT_SIZE;
        if (this.header.pageFreeSpace > tmpSize) {
            this._insertRecord(record);
        }
        else {
            this._compress();
            this._insertRecord(record);
        }
    }

    private _compress() {
        const count = this.recordCount;
        const records = new Array<RTRecord>();
        for (let i = 0; i < count; i++) {
            records[i] = this.record(i)!;
        }

        this.header.recordCount = 1;
        this.header.endDataOffset = RTConstants.RECORDSET_HEADER_SIZE;
        this.header.pageFreeSpace = this.pageSize - RTConstants.PAGE_HEADER_SIZE - 
            this.header.endDataOffset - RTConstants.PAGE_SLOT_SIZE * 2;

        this.writePageHeader();
        for (let i = 0; i < records.length; i++) {
            this._insertRecord(records[i]);
        }
    }

    private _insertRecord(record: RTRecord) {
        this.writer!.seek(RTConstants.PAGE_HEADER_SIZE + this.header.endDataOffset);

        const recordSize = record.size(this.isFloat);
        const slot = new RTSlot();
        slot.length = recordSize;
        slot.offset = this.header.endDataOffset;

        this.header.recordCount++;
        this.header.endDataOffset += recordSize;
        this.header.pageFreeSpace -= recordSize + RTConstants.PAGE_SLOT_SIZE;
        this.writer!.seek(0);
        this.header.write(this.writer!);

        let position = RTConstants.PAGE_SLOT_SIZE * (this.header.recordCount + 1);
        this.writer!.seek(position, 'end');
        slot.write(this.writer!);

        position = slot.offset + RTConstants.PAGE_HEADER_SIZE;
        this.writer!.seek(position, 'begin');

        record.write(this.writer!, this.isFloat);
        this.isDirty = true;
    }

    public deleteRecord(id: number) { 
        const recordCount = this.recordCount;
        if (id < 0 || id >= recordCount) {
            throw new Error(`id: ${id} out of range [${0}, ${recordCount}).`);
        }

        id++;

        const nextSlot = new RTSlot();
        const currSlot = new RTSlot();
        let position = (id + RTConstants.ALIGNED_SLOT_COUNT) * RTConstants.PAGE_SLOT_SIZE;

        for (let j = id; j < recordCount; j++) {
            let nextPosition = position + RTConstants.PAGE_SLOT_SIZE;
            this.reader!.seek(nextPosition, 'end');
            nextSlot.read(this.reader!);
            currSlot.length = nextSlot.length;
            currSlot.offset = nextSlot.offset;
            this.writer!.seek(position, 'end');
            currSlot.write(this.writer!);
            position = nextPosition;
        }

        this.header.recordCount--;
        this.header.pageFreeSpace += RTConstants.PAGE_SLOT_SIZE;
        this.writePageHeader();
        this.isDirty = true;
    }

    public capacity() {
        const record = this.createRecord();
        let capacity = (this.pageSize - RTConstants.PAGE_HEADER_SIZE - RTConstants.RECORDSET_HEADER_SIZE - RTConstants.PAGE_SLOT_SIZE * 2) / (record.size(this.isFloat) + RTConstants.PAGE_SLOT_SIZE);
        capacity = Math.floor(capacity);
        return capacity;
    }
    
    public envelope(): RTRectangle {
        let rect = new Envelope(0, 0, 0, 0);
        const recordCount = this.recordCount;
        if (recordCount > 0) {
            let record = this.record(0)!;
            rect = record.envelope();

            for (let i = 1; i < recordCount; i++) {
                record = this.record(i)!;
                rect = Envelope.union(rect, record.envelope());
            }
        }

        return new RTRectangle(rect.minx, rect.miny, rect.maxx, rect.maxy);
    }
}

/** @ignore */
export class RTChildPage extends RTLeafPage {
    constructor(rtFile: RTFile, recordType: RTRecordType, pageNo?: number) {
        super(rtFile, recordType, pageNo);
    }

    createRecord(): RTRecord {
        const record = new RTEntryRecord();
        return record;
    }

    capacity() {
        const entry = new RTEntryRecord();
        let count = (this.pageSize - 
            RTConstants.PAGE_HEADER_SIZE - 
            RTConstants.RECORDSET_HEADER_SIZE - 
            RTConstants.PAGE_SLOT_SIZE * 2) / (entry.size(this.isFloat) + RTConstants.PAGE_SLOT_SIZE);

        count = Math.floor(count);
        return count;
    }

    updateEntry(entry: RTEntryRecord, id: number) {
        const recordCount = this.recordCount;
        if (id < 0 || id >= recordCount) {
            throw new Error(`id ${id} out of range [${0}, ${recordCount}].`);
        }

        id++;
        let position = (id + RTConstants.ALIGNED_SLOT_COUNT) * RTConstants.PAGE_SLOT_SIZE;
        this.reader!.seek(position, 'end');

        const slot = new RTSlot();
        slot.read(this.reader!);

        position = slot.offset + RTConstants.PAGE_HEADER_SIZE;
        this.writer!.seek(position);
        entry.write(this.writer!, this.isFloat);
        this.isDirty = true;
    }
}

/** @ignore */
export class RTHeaderPage extends RTPage {
    public header: RTFileHeader = new RTFileHeader();

    constructor(rtFile: RTFile, recordType: RTRecordType = RTRecordType.point, pageNo?: number) {
        super(rtFile, recordType, pageNo);
    }

    public read() {
        this.fileStream!.seek(0);
        this.header.read(this.fileStream!);
    }

    public write() {
        this.fileStream!.seek(0);
        this.header.write(this.writer!);
        this.isDirty = true;
        this.flush();
    }
}

/** @ignore */
export class RTPageHeader {
    pageId = 0;
    pageFreeSpace = 0;
    endDataOffset = 0;
    recordCount = 0;
    vacantRecordCount = 0;
    placeholder = 0x0F0F0F0F;

    public read(reader: BufferReader) {
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

/** @ignore */
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

/** @ignore */
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

/** @ignore */
export class RTFileHeader {
    description: string = '';
    recordType: number = 0;
    freePageId: number = 0;
    extName: string = '';
    pageSize: number = 0;
    isFloat: boolean = false;

    public read(stream: FileStream) {
        const descBuff = stream.read(RTConstants.MAGIC_CHAR_LENGTH);
        this.description = descBuff.toString(RTConstants.DEFAULT_ENCODING);
        this.recordType = StreamUtils.readUInt32(stream);
        this.freePageId = StreamUtils.readUInt32(stream);
        if (this.recordType === 0) {
            this.extName = stream.read(RTConstants.POINT_EXT_LENGTH).toString(RTConstants.DEFAULT_ENCODING);
        }
        else {
            this.extName = stream.read(RTConstants.RECT_EXT_LENGTH).toString(RTConstants.DEFAULT_ENCODING);
        }

        this.pageSize = StreamUtils.readUInt32(stream);
        this.isFloat = StreamUtils.readByte(stream) !== 0;
    }

    public write(writer: BufferWriter) {
        const descBuff = Buffer.alloc(RTConstants.MAGIC_CHAR_LENGTH);
        descBuff.write(this.description, RTConstants.DEFAULT_ENCODING);
        writer.writeBuffer(descBuff);
        writer.writeUInt32(this.recordType);
        writer.writeUInt32(this.freePageId);
        writer.writeString(this.extName);
        writer.writeUInt32(this.pageSize);
        writer.writeUInt8(this.isFloat ? 1 : 0);
    }
}