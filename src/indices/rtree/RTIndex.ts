import fs from 'fs';
import path from "path";
import _ from 'lodash';
import { RTFile } from "./RTFile";
import { RTIds } from "./RTIds";
import { IEnvelope, Point } from "ginkgoch-geom";
import { RTNode, RTLeaf, RTChild } from "./RTNode";
import { RTLeafPage, RTChildPage } from "./RTPage";
import { RTRecordType } from "./RTRecordType";
import { RTRecordHeader, RTPoint, RTPointRecord, RTRectangleRecord } from "./RTRecord";
import { RTUtils } from "./RTUtils";
import { BaseIndex } from '../BaseIndex';

const FILE_EXTENSIONS = ['.idx', '.ids'];

export class RTIndex extends BaseIndex {
    private _rtFile: RTFile;
    private _idsEngine: RTIds;

    flag: string;
    filePath: string;
    opened = false;

    constructor(filePath: string = '', flag: string = 'rs') {
        super();

        this.flag = flag;
        this.filePath = filePath;
        this._rtFile = new RTFile();
        this._idsEngine = new RTIds();
    }

    open(flag?: string) {
        if (flag !== undefined && this.flag !== flag) {
            this.close();
            this.flag = flag;
        }

        if (this.opened) {
            return;
        }

        this._open();
        this.opened = true;
    }

    protected _open() {
        this._rtFile.open(this.filePath, this.flag);
        this._idsEngine.open(RTIndex._idsFilePath(this.filePath), this.flag);
    }

    close() {
        if (!this.opened) { 
            return;
        }

        this.opened = false;
        this._close();
    }

    protected _close() {
        this._rtFile.close();
        this._idsEngine.close();
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
            return RTUtils.kilobytes(4);
        }
        else if (recordCount <= 8192) {
            return RTUtils.kilobytes(8);
        }
        else if (recordCount <= 16384) {
            return RTUtils.kilobytes(16);
        }
        else {
            return RTUtils.kilobytes(32);
        }
    }

    static exists(filePath: string) {
        const ext = path.extname(filePath);
        const regex = new RegExp(ext + '$', 'i');
        const count = FILE_EXTENSIONS.filter(ex => {
            const indexFilePath = filePath.replace(regex, ex);
            return fs.existsSync(indexFilePath);
        }).length;

        return count === FILE_EXTENSIONS.length;
    }

    static entry(filePath: string) {
        const ext = path.extname(filePath);
        return filePath.replace(ext, '.idx');
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

    protected _count(): number {
        return this.root!.allRecordCount;
    }

    static create(filePath: string, recordType: RTRecordType, options?: RTIndexCreateOption) {
        options = this._defaultCreateOptions(options);
        this._cleanForOverwrite(filePath, options);
        if (this._skipCreate(filePath, options)) {
            return;
        }

        this._create(filePath, recordType, options);
    }

    protected _insiders(rect: IEnvelope) {
        const root = this.root!;
        const idx = new Array<number>();
        root.fillOverlaps(rect, idx);
        idx.sort();
        
        const ids = idx.map(id => this._idsEngine.id(id)).sort((a, b) => {
            const [ai, bi] = [parseInt(a), parseInt(b)];
            return ai - bi;
        });
        return ids;
    }

    private _insertPoint(x: number, y: number, id: string) {
        const recordHeader = new RTRecordHeader();
        recordHeader.keyLength = RTUtils.sizeOfPoint(this._rtFile.isFloat);
        recordHeader.elementLength = 4;
        recordHeader.childNodeId = 0;
        
        const blockId = this._idsEngine.write(id);
        const point = new RTPoint(x, y);
        const pointRecord = new RTPointRecord(recordHeader, point, blockId);
        const nodeList = new Array<RTNode>();
        this.root!.insertRecord(pointRecord, nodeList);
    }

    private _deletePoint(x: number, y: number) {
        const pointRecord = new RTPointRecord(undefined, new RTPoint(x, y), undefined);
        this.root!.delete(pointRecord);
    }

    private _insertRect(rect: IEnvelope, id: string) {
        const recordHeader = new RTRecordHeader();
        recordHeader.keyLength = RTUtils.sizeOfRectangle(this._rtFile.isFloat);
        recordHeader.elementLength = 4;
        recordHeader.childNodeId = 0;
        
        const blockId = this._idsEngine.write(id);
        const rectRecord = new RTRectangleRecord(recordHeader, rect, blockId);
        const nodeList = new Array<RTNode>();
        this.root!.insertRecord(rectRecord, nodeList);
    }

    private _deleteRect(rect: IEnvelope) {
        const rectRecord = new RTRectangleRecord(undefined, rect, undefined);
        this.root!.delete(rectRecord);
    }

    //#region create private methods
    private static _create(filePath: string, recordType: RTRecordType, options: RTIndexCreateOption) {
        const index = new RTIndex();
        index._rtFile.create(filePath, recordType, options.float!, options.pageSize!);

        const idsFilePath = this._idsFilePath(filePath);
        RTIds.createEmpty(idsFilePath);
        index.close();
    }

    private static _defaultCreateOptions(options?: RTIndexCreateOption): RTIndexCreateOption {
        options = options || {};
        options = _.defaults(options, { pageSize: RTUtils.kilobytes(8), overwrite: false, float: true });
        return options;
    }

    private static _cleanForOverwrite(filePath: string, options: RTIndexCreateOption) {
        if (options.overwrite! === false) return;

        FILE_EXTENSIONS.forEach(ext => {
            const tmpPath = filePath.replace(/\.idx$/i, ext);
            if (fs.existsSync(tmpPath)) {
                fs.unlinkSync(tmpPath);
            }
        });
    }

    private static _skipCreate(filePath: string, options: RTIndexCreateOption): boolean {
        const count = FILE_EXTENSIONS.filter(ext => {
            const tmpPath = filePath.replace(/\.idx$/i, ext);
            return fs.existsSync(tmpPath);
        }).length;

        return count === FILE_EXTENSIONS.length && !(options.overwrite!);
    }

    private static _idsFilePath(idxFilePath: string) {
        return idxFilePath.replace(/\.idx$/i, '.ids');
    }
    //#endregion

}

export interface RTIndexCreateOption {
    float?: boolean;
    pageSize?: number;
    overwrite?: boolean;
}