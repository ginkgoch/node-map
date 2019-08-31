import assert from 'assert';
import fs from 'fs';
import { FileStream } from "ginkgoch-filestream";
import { RTGeomType } from "./RTGeomType";
import { RTLeafPage, RTHeaderPage, RTDataPage, RTChildPage, RTFileHeader } from "./RTPage";
import { RTConstants, RTUtils } from './RTUtils';

const DESCRIPTION = 'Gist data file ';

export class RTFile {
    opened = false;
    isFloat = false;
    flag: string = 'rs+';
    pageSize: number = 0;
    fileStream?: FileStream;
    headerPage?: RTHeaderPage;

    create(filePath: string, geomType: RTGeomType, float: boolean, pageSize: number) {
        this.pageSize = pageSize;

        const fd = fs.openSync(filePath, 'w+');
        this.fileStream = new FileStream(fd);
        this._initFileHeader(geomType, float);
        this._writeFileHeader();
        this.opened = true;

        const leafPage = new RTLeafPage(this, geomType, 1);
        leafPage.initEmptyPage();
        leafPage.flush();

        this.close();
        fs.closeSync(fd);
        
        this.open(filePath, 'rs+');
    }

    get geomType(): RTGeomType {
        return this.headerPage!.header.extId;
    }

    get pageCount(): number {
        const pageCount = this.fileStream!.total / this.pageSize;
        return pageCount;
    }

    get rootNodePage(): RTDataPage | null {
        if (!this.opened) {
            return null;
        }

        let rootPage: RTDataPage;
        const pageCount = this.pageCount;
        if (pageCount === 2) {
            rootPage = new RTLeafPage(this, this.geomType, 1);
        }
        else {
            rootPage = new RTChildPage(this, this.geomType, 1);
        }

        return rootPage;
    }

    open(filePath: string, flag: string = 'rs'): boolean {
        if (this.opened) {
            return true;
        }

        this.fileStream = new FileStream(filePath, flag);
        this.opened = true;
        this.headerPage = new RTHeaderPage(this);

        this._readFileHeader();
        assert(this.headerPage.header.description === DESCRIPTION, 'Invalid index file.');

        if (this.headerPage.header.pageSize !== 0) {
            this.pageSize = this.headerPage.header.pageSize;
        }
        else {
            this.pageSize = RTUtils.kilobytes(8);
        }

        this.isFloat = this.headerPage.header.isFloat;
        this.flag = flag;

        return true;
    }

    close() {
        if (this.fileStream === undefined || !this.opened) {
            return;
        }

        this.fileStream && this.fileStream.close();
        this.fileStream = undefined;
        this.opened = false;
    }

    private _readFileHeader() {
        this.headerPage!.read();
    }

    private _writeFileHeader() {
        this.headerPage!.write();
    }

    private _initFileHeader(geomType: RTGeomType, float: boolean) {
        this.pageSize = this.pageSize || RTUtils.kilobytes(8);
        this.headerPage = new RTHeaderPage(this, geomType, 0);

        const fileHeader = new RTFileHeader();
        fileHeader.description = DESCRIPTION;
        fileHeader.extId = geomType;
        fileHeader.freePageId = 0;
        fileHeader.pageSize = this.pageSize;
        fileHeader.isFloat = float;

        if (geomType === RTGeomType.point) {
            fileHeader.extName = RTConstants.RECORD_POINT_TYPE;
        }
        else {
            fileHeader.extName = RTConstants.RECORD_RECT_TYPE;
        }

        this.headerPage.header = fileHeader;
    }
}