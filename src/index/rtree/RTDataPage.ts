import { RTPage } from "./RTPage";
import { RTPageHeader } from "./RTPageHeader";
import { RTRecordSetHeader } from "./RTRecordSetHeader";
import { RTRecord, RTEntry } from "./RTRecord";
import { RTFile } from "./RTFile";
import { RTGeomType } from "./RTGeomType";
import { BufferReader, BufferWriter } from "ginkgoch-buffer-io";
import { RTConstants } from "./RTUtils";
import { RTSlot } from "./RTSlot";
import { Envelope } from "ginkgoch-geom";

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