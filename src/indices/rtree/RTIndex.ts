import fs from 'fs';
import path from "path";
import _ from 'lodash';
import { RTFile } from "./RTFile";
import { RTIds } from "./RTIds";
import { IEnvelope, Point, Geometry, Feature } from "ginkgoch-geom";
import { RTNode, RTLeaf, RTChild } from "./RTNode";
import { RTLeafPage, RTChildPage } from "./RTPage";
import { RTRecordType } from "./RTRecordType";
import { RTRecordHeader, RTPoint, RTPointRecord, RTRectangleRecord } from "./RTRecord";
import { RTUtils } from "./RTUtils";
import { BaseIndex } from '../BaseIndex';

const FILE_EXTENSIONS = ['.idx', '.ids'];

/**
 * This class is an implementation of {BaseIndex}. It allows to build or read index with R-Tree index technology.
 */
export class RTIndex extends BaseIndex {
    private _rtFile: RTFile;
    private _idsEngine: RTIds;

    /**
     * @property {string} flag The file system flags to open the r-tree spatial index file.
     * @see {@link https://nodejs.org/api/fs.html#fs_file_system_flags} for options.
     */
    flag: string;

    /**
     * @property {string}
     */
    filePath: string;

    /**
     * @property {boolean} opened Gets the status whether this index file is opened.
     */
    opened = false;

    /**
     * Constructs the r-tree spatial index instance.
     * @constructor
     * @param {string} filePath The file path of the spatial indexed file.
     * @param {string} flag The file system flags to open the r-tree spatial index file. 
     * Refers {@link https://nodejs.org/api/fs.html#fs_file_system_flags} for options. Default is 'rs'.
     */
    constructor(filePath: string = '', flag: string = 'rs') {
        super();

        this.flag = flag;
        this.filePath = filePath;
        this._rtFile = new RTFile();
        this._idsEngine = new RTIds();
    }

    /**
     * Opens the spatial index file.
     * @param {string} flag The file system flags to open the r-tree spatial index file. 
     * Refers {@link https://nodejs.org/api/fs.html#fs_file_system_flags} for options. 
     * It is optional with default option 'rs'.
     */
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

    /**
     * @protected 
     * The concrete implementation of open() func.
     */
    protected _open() {
        this._rtFile.open(this.filePath, this.flag);
        this._idsEngine.open(RTIndex._idsFilePath(this.filePath), this.flag);
    }

    /**
     * Closes the r-tree spatial index file handler and release stream resource.
     */
    close() {
        if (!this.opened) { 
            return;
        }

        this.opened = false;
        this._close();
    }

    /**
     * @protected 
     * The concrete implementation of close() func.
     */
    protected _close() {
        this._rtFile.close();
        this._idsEngine.close();
    }

    /**
     * Deletes the indexed records that intersect with the given geometry or envelope.
     * @param {Geometry | IEnvelope} geom The geometry or envelope to filter inside the r-tree spatial index file for deleting.
     */
    delete(geom: Geometry): void;
    delete(rect: IEnvelope): void;
    delete(geom: Geometry | IEnvelope): void {
        if (geom instanceof Point) {
            this._deletePoint(geom.x, geom.y);
        }
        else if (geom instanceof Geometry) {
            this._deleteRect(geom.envelope());
        }
        else {
            this._deleteRect(geom);
        }
    }

    /**
     * Pushes new record into the r-tree spatial index.
     * @param {Geometry | IEnvelope} geom The geometry or envelope to push into the index.
     * @param {string} id The id of the record to push into the index. 
     */
    push(geom: Geometry | IEnvelope, id: string): void {
        if (geom instanceof Point) {
            this._insertPoint(geom.x, geom.y, id);
        }
        else if (geom instanceof Geometry) {
            this._insertRect(geom.envelope(), id);
        }
        else {
            this._insertRect(geom, id);
        }
    }

    /**
     * Gets a recommend page size in kilobytes based on the record count to index. 
     * A proper page size will directly impact the query performance and the index file physical size.
     * @param {number} recordCount The record count of the records that is going to be indexed.
     * @returns {number} A page size in kilobytes that is recommend to use when create a new spatial index file.
     */
    static recommendPageSize(recordCount: number): number {
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

    /**
     * Check whether the r-tree spatial index file exists. 
     * Both *.ids and *.idx files will be checked.
     * @param {string} filePath The file path (either *.idx and *.ids are acceptable) of the r-tree spatial index.
     * @returns {boolean} Whether the r-tree spatial index file exists.
     */
    static exists(filePath: string): boolean {
        const ext = path.extname(filePath);
        const regex = new RegExp(ext + '$', 'i');
        const count = FILE_EXTENSIONS.filter(ex => {
            const indexFilePath = filePath.replace(regex, ex);
            return fs.existsSync(indexFilePath);
        }).length;

        return count === FILE_EXTENSIONS.length;
    }

    /**
     * Gets the index entry file path from a given file path. Any file extension will be replaced with *.idx.
     * @param {string} filePath The source file.
     * @returns {string} The .idx file path based on the given file path.
     */
    static entry(filePath: string): string {
        const ext = path.extname(filePath);
        return filePath.replace(ext, '.idx');
    }

    /**
     * Gets the index temp file path from a given file path.
     * @param {string} filePath The source file.
     * @returns {string} The temp file path based on the given file path.
     * @summary Temp file path is used to avoid to pollute current existing index file. 
     * Once the building process is complete, the new index file will replace the old one.
     */
    static temp(filePath: string) {
        const ext = path.extname(filePath);
        filePath = filePath.replace(ext, '.idx');

        const dirname = path.dirname(filePath);
        const basename = path.basename(filePath);
        const tempFilePath = path.join(dirname, 'TMP_' + basename);
        return tempFilePath;
    }

    /**
     * Clean all index files based on the given file path.
     * @param {string} filePath The source file path of the index file.
     */
    static clean(filePath: string) {
        const sourceExt = path.extname(filePath);
        FILE_EXTENSIONS.forEach(ext => {
            const indexFilePath = filePath.replace(sourceExt, ext);
            if (fs.existsSync(indexFilePath)) {
                fs.unlinkSync(indexFilePath);
            }
        })
    }

    /**
     * Moves index file path from one to another.
     * @param {string} sourcePath The source file to move.
     * @param {string} targetPath The target file to move to.
     * @param {boolean} overwrite True to overwrite the target file if exists. Otherwise not.
     */
    static move(sourcePath: string, targetPath: string, overwrite = true) {
        const exists = this.exists(targetPath);
        if (exists && overwrite) {
            this.clean(targetPath);
        }
        else if (exists) {
            return;
        }

        const sourceExt = path.extname(sourcePath);
        const targetExt = path.extname(targetPath);
        FILE_EXTENSIONS.forEach(ext => {
            const source = sourcePath.replace(sourceExt, ext);
            const target = targetPath.replace(targetExt, ext);
            fs.renameSync(source, target);
        });
    }

    /**
     * @property {number} pageSize Gets the page size.
     */
    get pageSize() {
        return this._rtFile.pageSize;
    }

    /**
     * @property {number} pageSize Sets the page size.
     */
    set pageSize(pageSize: number) {
        this._rtFile.pageSize = pageSize;
    }

    /**
     * @property {RTNode} R
     */
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

    /**
     * The concrete function to get indexed record count for override.
     * @override
     */
    protected _count(): number {
        return this.root!.allRecordCount;
    }

    /**
     * Create an empty r-tree spatial index file.
     * @param {string} filePath The target index file path.
     * @param {RTRecordType} recordType The record type.
     * @param {RTIndexCreateOption} options The extra options for creating index file.
     */
    static create(filePath: string, recordType: RTRecordType, options?: RTIndexCreateOption) {
        options = this._defaultCreateOptions(options);
        this._cleanForOverwrite(filePath, options);
        if (this._skipCreate(filePath, options)) {
            return;
        }

        this._create(filePath, recordType, options);
    }

    /**
     * @override 
     * The concrete abstract function to get the record ids that are inside the rectangle from index.
     * @param {IEnvelope} rect rect The rectangle to query records.
     * @return {string[]} The record ids that intersects the given rectangle.
     */
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
        const rectRecord = new RTRectangleRecord(recordHeader, _.clone(rect), blockId);
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

/**
 * The extra options for creating r-tree spatial index file.
 */
export interface RTIndexCreateOption {
    float?: boolean;
    pageSize?: number;
    overwrite?: boolean;
}