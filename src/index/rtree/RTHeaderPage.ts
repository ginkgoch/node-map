import { RTPage } from "./RTPage";
import { RTFile } from "./RTFile";
import { RTGeomType } from "./RTGeomType";
import { RTFileHeader } from "./RTFileHeader";

export class RTHeaderPage extends RTPage {
    public header: RTFileHeader = new RTFileHeader();

    constructor(rtFile: RTFile, geomType: RTGeomType, pageNo?: number) {
        super(rtFile, geomType, pageNo);
    }

    public read() {
        this.fileStream!.seek(0);
        this.header!.read(this.fileStream!);
    }

    public write() {
        const stream = this.fileStream!;
        stream.seek(0);
        this.header.write(stream);
        this.isDirty = true;
        this.flush();
    }
}