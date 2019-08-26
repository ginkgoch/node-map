import { FileStream } from "ginkgoch-shapefile/dist/shared/FileStream";
import { RTFile } from "./RTFile";
import { RTGeomType } from "./RTGeomType";

export class RTPage {
    protected memStream: Buffer;
    protected arrBuff: Buffer;
    protected fileStream: FileStream;
    protected rtFile: RTFile;
    protected pageNum: number;
    protected geomType: RTGeomType;
    protected isDirty = true;
    public pageSize: number;
    
}