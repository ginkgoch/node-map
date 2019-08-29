import { RTFile } from "./RTFile";
import { RTIds } from "./RTIds";
import { IEnvelope, Point } from "ginkgoch-geom";
import { RTNode, RTLeaf, RTChild } from "./RTNode";
import { RTLeafPage, RTChildPage } from "./RTPage";
import { RTGeomType } from "./RTGeomType";

export class RTIndex {
    private _rtFile: RTFile;
    private _idsEngine: RTIds;
    private _hasIdx: boolean = false;

    flag: string;
    filePath: string;

    constructor(filePath: string = '', flag: string = 'rs') {
        this.flag = flag;
        this.filePath = filePath;
        this._rtFile = new RTFile();
        this._idsEngine = new RTIds();
    }

    invalidCache() {
        this._idsEngine.invalidCache();
    }

    delete(point: Point): void;
    delete(rect: IEnvelope): void;
    delete(geom: Point | IEnvelope): void {
        if (geom instanceof Point) {
            this._deletePoint(geom);
        }
        else {
            this._deleteRect(geom);
        }
    }

    private _deleteRect(rect: IEnvelope) {
        throw new Error("Method not implemented.");
    }

    private _deletePoint(point: Point) {
        throw new Error("Method not implemented.");
    }

    add(point: Point, id: string): void;
    add(rect: IEnvelope, id: string): void;
    add(geom: Point|IEnvelope, id: string): void {
        if (geom instanceof Point) {
            this._addPoint(geom, id);
        }
        else {
            this._addRect(geom, id);
        }
    }

    private _addRect(geom: IEnvelope, id: string) {
        throw new Error("Method not implemented.");
    }

    private _addPoint(geom: Point, id: string) {
        throw new Error("Method not implemented.");
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

    static create(filePath: string, geomType: RTGeomType, float: boolean = false, pageSize = 8 * 1024) {
        if (geomType === RTGeomType.point) {
            const index = new RTIndex();
            index._createPointIndexFile(filePath, float, pageSize);
        }
        else {
            
        }
    }

    private _createPointIndexFile(filePath: string, float: boolean, pageSize: number) {
        throw new Error("Method not implemented.");
    }

    static idsFilePath(idxFilePath: string) {
        return idxFilePath.replace(/\.idx$/i, '.ids');
    }
}