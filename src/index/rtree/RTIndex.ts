import assert from 'assert';
import { RTFile } from "./RTFile";
import { RTIds } from "./RTIds";
import { IEnvelope, Point } from "ginkgoch-geom";
import { RTNode, RTLeaf, RTChild } from "./RTNode";
import { RTLeafPage, RTChildPage } from "./RTPage";
import { RTGeomType } from "./RTGeomType";
import { RTRecordHeader, RTPoint, RTPointRecord, RTRectangle, RTRectangleRecord } from "./RTRecord";
import { RTUtils } from "./RTUtils";

const FILE_NOT_OPENED = 'Index file not opened.';

export class RTIndex {
    private _rtFile: RTFile;
    private _idsEngine: RTIds;
    private _hasIdx: boolean = false;

    flag: string;
    filePath: string;
    opened = false;

    constructor(filePath: string = '', flag: string = 'rs') {
        this.flag = flag;
        this.filePath = filePath;
        this._rtFile = new RTFile();
        this._idsEngine = new RTIds();
    }

    open() {
        if (this.opened) {
            return;
        }

        this._rtFile.open(this.filePath, this.flag);
        this._idsEngine.flag = this.flag;
        this._idsEngine.filePath = RTIndex._idsFilePath(this.filePath);
        this._idsEngine.open();
        this._hasIdx = true;
        this.opened = true;
    }

    close() {
        if (!this.opened) { 
            return;
        }

        this.opened = false;
        this._rtFile.close();
        this._idsEngine.close();
    }

    invalidCache() {
        this._idsEngine.invalidCache();
    }

    delete(point: Point): void;
    delete(rect: IEnvelope): void;
    delete(geom: Point | IEnvelope): void {
        if (geom instanceof Point) {
            this._deletePoint(geom.x, geom.y);
        }
        else {
            this._deleteRect(geom);
        }
    }

    push(point: Point, id: string): void;
    push(rect: IEnvelope, id: string): void;
    push(geom: Point | IEnvelope, id: string): void {
        if (geom instanceof Point) {
            this._insertPoint(geom.x, geom.y, id);
        }
        else {
            this._insertRect(geom, id);
        }
    }

    static recommendPageSize(recordCount: number) {
        if (recordCount <= 4086) {
            return 4 * 1024;
        }
        else if (recordCount <= 8192) {
            return 8 * 1024;
        }
        else if (recordCount <= 16384) {
            return 16 * 1024;
        }
        else {
            return 32 * 1024;
        }
    }

    get pageSize() {
        return this._rtFile.pageSize;
    }

    set pageSize(pageSize: number) {
        this._rtFile.pageSize = pageSize;
    }

    get root(): RTNode | null {
        const dataPage = this._rtFile.rootNodePage;
        if (dataPage === null) {
            return null;
        }

        let root: RTNode;
        if (dataPage.level === 1) {
            root = new RTLeaf(<RTLeafPage>dataPage);
        }
        else {
            root = new RTChild(<RTChildPage>dataPage);
        }

        return root;
    }

    get count(): number {
        assert(this.opened, FILE_NOT_OPENED);

        return this.root!.allRecordCount;
    }

    static create(filePath: string, geomType: RTGeomType, float: boolean = false, pageSize = 8 * 1024) {
        const index = new RTIndex();
        index._createIndexFile(filePath, geomType, float, pageSize);
        const idsFilePath = this._idsFilePath(filePath);
        RTIds.createEmpty(idsFilePath);
        index.close();
    }

    idsIntersects(rect: IEnvelope) {
        return this.idsInsides(rect);
    }

    idsInsides(rect: IEnvelope) {
        assert(this.opened, FILE_NOT_OPENED);

        const root = this.root!;
        const idx = new Array<number>();
        root.fillOverlaps(rect, idx);
        idx.sort();
        
        const ids = new Array<string>();
        idx.forEach(id => {
            ids.push(this._idsEngine.id(id));
        });

        return ids;
    }

    private _createIndexFile(filePath: string, geomType: RTGeomType, float: boolean, pageSize: number) {
        this.pageSize = pageSize;
        this._rtFile.create(filePath, geomType, float);
    }

    private static _idsFilePath(idxFilePath: string) {
        return idxFilePath.replace(/\.idx$/i, '.ids');
    }

    private _insertPoint(x: number, y: number, id: string) {
        const blockId = this._idsEngine.write(id);
        const recordHeader = new RTRecordHeader();
        recordHeader.keyLength = RTUtils.sizeOfPoint(this._rtFile.isFloat);
        recordHeader.elementLength = 4;
        recordHeader.childNodeId = 0;

        const point = new RTPoint(x, y);
        const pointRecord = new RTPointRecord(recordHeader, point, blockId);
        const nodeList = new Array<RTNode>();
        this.root!.insertRecord(pointRecord, nodeList);
    }

    private _deletePoint(x: number, y: number) {
        const pointRecord = new RTPointRecord();
        pointRecord.setPoint(new RTPoint(x, y));
        this.root!.delete(pointRecord);
    }

    private _insertRect(rect: IEnvelope, id: string) {
        const blockId = this._idsEngine.write(id);
        const recordHeader = new RTRecordHeader();
        recordHeader.keyLength = RTUtils.sizeOfRectangle(this._rtFile.isFloat);
        recordHeader.elementLength = 4;
        recordHeader.childNodeId = 0;

        const rectangle = this._parseRect(rect);
        const rectRecord = new RTRectangleRecord(recordHeader, rectangle, blockId);
        const nodeList = new Array<RTNode>();
        this.root!.insertRecord(rectRecord, nodeList);
    }

    private _deleteRect(rect: IEnvelope) {
        const rectangle = this._parseRect(rect);
        const rectRecord = new RTRectangleRecord();
        rectRecord.rectangle = rectangle;
        this.root!.delete(rectRecord);
    }

    private _parseRect(rect: IEnvelope) {
        const rectangle = new RTRectangle(rect.minx, rect.miny, rect.maxx, rect.maxy);
        return rectangle;
    }
}