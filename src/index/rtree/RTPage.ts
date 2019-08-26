import { FileStream } from "ginkgoch-shapefile/dist/shared/FileStream";
import { RTFile } from "./RTFile";
import { RTGeomType } from "./RTGeomType";
import { BufferReader, BufferWriter } from "ginkgoch-buffer-io";

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