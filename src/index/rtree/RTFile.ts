import assert from 'assert';
import { FileStream } from "ginkgoch-shapefile/dist/shared/FileStream";
import { RTGeomType } from "./RTGeomType";
import { RTLeafPage, RTHeaderPage } from "./RTPage";

const DESCRIPTION = 'Gist data file\0';

export class RTFile {
    opened = false;
    isFloat = false;
    flag: string = 'rs+';
    pageSize: number = 0;
    fileStream?: FileStream;
    headerPage?: RTHeaderPage;

    create(filePath: string, geomType: RTGeomType, float: boolean) {
        this.fileStream = new FileStream(filePath);
        this._initFileHeader(geomType, this.isFloat);
        this._writeFileHeader();
        this.opened = true;

        const leafPage = new RTLeafPage(this, geomType, 1);
        leafPage.initEmptyPage();
        leafPage.flush();

        this.close();
        this.open(filePath, 'rs+');
    }

    open(filePath: string, flag: string = 'rs'): boolean {
        if (this.opened) {
            return true;
        }
        
        let success = false;
        this.fileStream = new FileStream(filePath, flag);
        this.opened = true;
        this.headerPage = new RTHeaderPage(this);

        success = this._readFileHeader();
        assert (this.headerPage.header.description === DESCRIPTION, 'Invalid index file.');

        if (success) {
            if (this.headerPage.header.pageSize !== 0) {
                this.pageSize = this.headerPage.header.pageSize;
            }
            else {
                this.pageSize = 8 * 1024;
            }
        }

        this.isFloat = this.headerPage.header.isFloat;
        this.flag = flag;

        return success;
    }

    close() {
        throw new Error("Method not implemented.");
    }

    private _readFileHeader(): boolean {
        throw new Error("Method not implemented.");
    }

    private _writeFileHeader() {
        throw new Error("Method not implemented.");
    }

    private _initFileHeader(geomType: RTGeomType, isFloat: boolean) {
        throw new Error("Method not implemented.");
    }
}