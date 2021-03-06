import _ from "lodash";
import { RTDataPage, RTLeafPage, RTChildPage } from "./RTPage";
import { RTRecordType } from "./RTRecordType";
import { RTConstants, RTUtils } from "./RTUtils";
import { RTRecord, RTRectangle, RTEntryRecord, RTRecordHeader } from "./RTRecord";
import { Envelope, IEnvelope } from "ginkgoch-geom";
import { RTIds } from "./RTIds";
import { RTFile } from "./RTFile";

/** @ignore */
export class RTNode {
    dataPage: RTDataPage;
    cursor = 0;

    constructor(dataPage: RTDataPage) {
        this.dataPage = dataPage;
    }

    static create(dataPage: RTDataPage): RTNode {
        const level = dataPage.level;
        let node: RTNode;
        if (level === 1) {
            const leafPage = new RTLeafPage(dataPage.rtFile, dataPage.recordType, dataPage.pageNo);
            node = new RTLeaf(leafPage);
        }
        else {
            const childPage = new RTChildPage(dataPage.rtFile, dataPage.recordType, dataPage.pageNo);
            node = new RTChild(childPage);
        }
        return node;
    }

    get recordType(): RTRecordType {
        return this.dataPage.recordType;
    }

    get recordCount(): number {
        return this.dataPage.recordCount;
    }

    check(): boolean {
        let success = true;
        const count = this.recordCount;
        if (count > 0) {
            let record = this.firstRecord;
            while (record !== null) {
                record = this.nextRecord;
            }

            if (!this.eof) {
                success = false;
            }
        }

        if (success) {
            for (let i = 0; i < count; i++) {
                const subNode = this.subNode(i);
                if (subNode === null) {
                    continue;
                }

                success = subNode.check();
            }
        }

        return success;
    }

    subNode(id: number): RTNode | null {
        const recordCount = this.recordCount;
        if (id < 0 || id >= recordCount) {
            return null;
        }

        const child = this.dataPage.record(id)!.child();
        if (child === 0) {
            return null;
        }

        const rtFile = this.dataPage.rtFile;
        const recordType = this.dataPage.recordType;
        const dataPage = new RTDataPage(rtFile, recordType, child);
        const childNode = RTNode.create(dataPage);
        return childNode;
    }

    get level() {
        return this.dataPage.level;
    }

    set level(level: number) {
        this.dataPage.level = level;
    }

    get pageNo() {
        return this.dataPage.pageNo;
    }

    set pageNo(pageNo: number) {
        this.dataPage.setPageNo(pageNo);
    }

    get firstRecord(): RTRecord | null {
        this.cursor = 0;
        const record = this.dataPage.firstRecord;
        return record;
    }

    get nextRecord(): RTRecord | null {
        this.cursor++;
        const record = this.dataPage.nextRecord;
        return record;
    }

    get eof(): boolean {
        return this.dataPage.eof;
    }

    get allRecordCount(): number {
        let currentCount =  this.recordCount;
        if (this.isLeaf) {
            return currentCount;
        }

        let count = 0;
        for (let i = 0; i < currentCount; i++) {
            const node = this.subNode(i);
            
            if (node === null) {
                continue;
            }
            
            count += node.allRecordCount;
        }

        return count;
    }

    envelope(): RTRectangle {
        return this.dataPage.envelope();
    }

    record(id: number): RTRecord | null {
        return this.dataPage.record(id);
    }

    contains(rect: IEnvelope) {
        const currentRect = this.envelope();
        return Envelope.contains(currentRect, rect);
    }

    isContained(rect: IEnvelope) {
        const currentRect = this.envelope();
        return Envelope.contains(rect, currentRect);
    }

    overlaps(rect: IEnvelope) {
        const currentRect = this.envelope();
        return Envelope.overlaps(currentRect, rect);
    }

    fillAll(ids: number[]): number {
        let count = 0;
        let recordCount = this.recordCount;
        for (let i = 0; i < recordCount; i++) {
            const subNode = this.subNode(i)!;
            count += subNode.fillAll(ids);
        }

        return count;
    }

    fillContains(rect: IEnvelope, ids: number[]): number {
        let count = 0;
        let currentCount = this.recordCount;
        for (let i = 0; i < currentCount; i++) {
            const record = this.record(i)!;
            const recordRect = record.envelope();

            if (Envelope.contains(recordRect, rect)) {
                const subNode = this.subNode(i)!;
                count += subNode.fillContains(rect, ids);
            }
        }

        return count;
    }

    fillOverlaps(rect: IEnvelope, ids: number[]): number {
        let count = 0;
        if (!this.overlaps(rect)) {
            return count;
        }

        if (this.isContained(rect)) {
            count = this.fillAll(ids);
            return count;
        }

        const currentCount = this.recordCount;
        for (let i = 0; i < currentCount; i++) {
            const record = this.record(i)!;
            const recordRect = record.envelope();
            if (Envelope.contains(recordRect, rect) || Envelope.overlaps(recordRect, rect)) {
                const subNode = this.subNode(i)!;
                count += subNode.fillOverlaps(rect, ids);
            } 
        }

        return count;
    }

    get isRoot(): boolean {
        return this.pageNo === 1;
    }

    get isLeaf(): boolean {
        return this.level === 1;
    }

    get isChild(): boolean {
        return !this.isLeaf;
    }

    protected quadSplit(rectList: RTRectangle[]): number[][] {
        const spRectList = new Array<number>();
        for (let i = 0; i < rectList.length; i++) {
            spRectList.push(i);
        }

        let min = Math.round(this.dataPage.capacity() * RTConstants.FILL_FACTOR);
        if (min < 2) {
            min = 2;
        }
        
        const rectArr = new Array<RTRectangle>();
        rectList.forEach(r => rectArr.push(r));

        const seeds = this.pickSeeds(rectArr);
        const leftRectList = new Array<number>();
        const rightRectList = new Array<number>();
        leftRectList.push(seeds[0]);
        rightRectList.push(seeds[1]);

        RTUtils.remove(spRectList, seeds[0]);
        RTUtils.remove(spRectList, seeds[1]);

        const mbr1 = _.clone(rectArr[seeds[0]]);
        const mbr2 = _.clone(rectArr[seeds[1]]);

        while(spRectList.length > 0) {
            if (min - leftRectList.length === spRectList.length) {
                this.addRest(spRectList, leftRectList);
            }
            else if (min - rightRectList.length === spRectList.length) {
                this.addRest(spRectList, rightRectList);
            }
            else {
                this.pickNext(rectArr, spRectList, leftRectList, rightRectList, mbr1, mbr2);
            }
        }

        const result = [leftRectList, rightRectList];
        return result; 
    }

    private pickNext(rectArr: RTRectangle[], spRectList: number[], leftRectList: number[], rightRectList: number[], mbr1: RTRectangle, mbr2: RTRectangle) {
        let diff = Number.NEGATIVE_INFINITY;
        let d1 = 0, d2 = 0, md1 = 0, md2 = 0, sel = -1;
        const mbr1Area = mbr1.area();
        const mbr2Area = mbr2.area();

        for (let i = 0; i < spRectList.length; i++) {
            const id = spRectList[i];
            d1 = RTUtils.unionArea(mbr1, rectArr[id]) - mbr1Area;
            d2 = RTUtils.unionArea(mbr2, rectArr[id]) - mbr2Area;

            const currentDiff = Math.abs(d1 - d2);
            if (currentDiff > diff) {
                diff = currentDiff;
                md1 = d1;
                md2 = d2;
                sel = id;
            }
        }

        const fillLeftRectList = () => {
            leftRectList.push(sel);
            RTUtils.remove(spRectList, sel);
            mbr1.expand(rectArr[sel]);
        };

        const fillRightRectList = () => {
            rightRectList.push(sel);
            RTUtils.remove(spRectList, sel);
            mbr2.expand(rectArr[sel]);
        }

        if (md1 < md2) {
            fillLeftRectList();
        }
        else if (md2 < md1) {
            fillRightRectList();
        }
        else if (mbr1Area < mbr2Area) {
            fillLeftRectList();
        }
        else if (mbr2Area < mbr1Area) {
            fillRightRectList();                
        }
        else if (leftRectList.length < rightRectList.length) {
            fillLeftRectList();
        }
        else if (rightRectList.length < leftRectList.length) {
            fillRightRectList();
        }
        else {
            fillLeftRectList();
        }
    }

    private addRest(spRectList: number[], rectList: number[]) {
        for (let i = 0; i < spRectList.length; i++) {
            const id = spRectList[i];
            rectList.push(id);
            RTUtils.remove(spRectList, id);
        }
    }

    private pickSeeds(rectArr: RTRectangle[]): number[] {
        const ids = [0, 0];
        const count = rectArr.length;
        let tmp = Number.MIN_VALUE;
        for (let i = 0; i < count; i++) {
            const area = rectArr[i].area();
            for (let j = i + 1; j < count; j++) {
                const sep = Envelope.union(rectArr[i], rectArr[j]).area() - area - rectArr[j].area();
                if (sep > tmp) {
                    ids[0] = i;
                    ids[1] = j;
                    tmp = sep;
                }
            }
        }

        return ids;
    }

    private static adjustTree(node: RTNode, id: number, split: boolean) {
        const childNode = node.subNode(id);
        if (childNode === null) {
            return;
        }

        const entry = node.record(id) as RTEntryRecord;
        if (entry === null) {
            return;
        }

        if (split) {
            entry.rectangle = childNode.envelope();
            this.updateEntry(node, entry, id);
        }
        else {
            const entryRect = entry.envelope();
            const childRect = childNode.envelope();
            if (!Envelope.contains(entryRect, childRect)) {
                entry.rectangle = childRect;
                this.updateEntry(node, entry, id);
            }
        }
    }

    private static updateEntry(node: RTNode, entry: RTEntryRecord, id: number) {
        node.dataPage.updateEntry(entry, id);
        node.dataPage.flush();
    }

    insertRecord(record: RTRecord, nodeList: RTNode[]) {
        const subNodeList = new Array<RTNode>();
        const rect = record.envelope();
        const index = this.findSmallestExpansion(rect);
        const subNode = this.subNode(index);
        if (subNode === null) {
            return;
        }

        subNode.insertRecord(record, subNodeList);
        const split = subNodeList.length === 2;
        RTNode.adjustTree(this, index, split);

        if (split) {
            const entry = <RTEntryRecord>this.firstRecord;
            const entryHeader = entry.header;
            entryHeader.childNodeId = subNodeList[1].pageNo;
            entry.rectangle = subNodeList[1].envelope();
            this._insertRecord(entry, nodeList);
        }
    }

    private findSmallestExpansion(rect: RTRectangle): number {
        let area = Number.MAX_VALUE;
        let id = 0;
        let recordCount = this.recordCount;
        for (let i = 0; i < recordCount; i++) {
            const entry = this.record(i) as RTEntryRecord;
            const entryArea = entry.rectangle.area();
            const enlargeArea = entry.rectangle.expandedArea(rect) - entryArea;

            if (enlargeArea < area) {
                area = enlargeArea;
                id = i;
            }
            else if (enlargeArea === area) {
                const entry2 = this.record(id);
                const rect2 = entry2!.envelope();
                if (entryArea < rect2.area()) {
                    id = i
                }
            }
        }

        return id;
    }

    protected _insertRecord(record: RTRecord, nodeList: RTNode[]) {
        const capacity = this.dataPage.capacity();
        const recordCount = this.recordCount;
        if (recordCount < capacity) {
            this.dataPage.insertRecord(record);
            this.dataPage.flush();
        }
        else {
            this.splitNode(record, nodeList);
            if (this.isRoot) {
                this.splitRoot(nodeList);
            }
        }
    }

    protected _splitNode(record: RTRecord, nodeListIn: RTNode[], nodeListOut: RTNode[]) {
        nodeListOut.length = 0;
        const recordCount = this.recordCount;
        const recList = new Array<RTRecord>();
        const rectList = new Array<RTRectangle>();

        for (let i = 0; i < recordCount; i++) {
            const currentRecord = this.record(i)!;
            const currentRecordRect = currentRecord.envelope();
            recList.push(currentRecord);
            rectList.push(currentRecordRect);
        }

        const recordRect = record.envelope();
        recList.push(record);
        rectList.push(recordRect);

        const quadList = this.quadSplit(rectList);
        const level = this.level;

        this._fillSplitNode(nodeListIn[0], this.pageNo, level, quadList[0], recList);
        this._fillSplitNode(nodeListIn[1], this.dataPage.freePageNo, level, quadList[1], recList);

        nodeListIn.forEach(n => nodeListOut.push(n));
    }

    private _fillSplitNode(node: RTNode, pageNo: number, level: number, quadList: number[], records: RTRecord[]) {
        node.pageNo = pageNo;
        node.level = level;
        for (let i = 0; i < quadList.length; i++) {
            const id = quadList[i];
            node.dataPage.insertRecord(records[id]);
        }
        node.dataPage.flush();
    }

    protected splitNode(record: RTRecord, nodeList: RTNode[]) {
        nodeList.length = 0;
    }

    private splitRoot(nodes: RTNode[]) {
        const l = nodes[0];
        const ll = nodes[1];
        this._moveNodeToEnd(l);

        const rtFile = this.dataPage.rtFile;
        const recordType = this.dataPage.recordType;
        const rootPage = new RTChildPage(rtFile, recordType);
        rootPage.setPageNo(1);
        rootPage.level = l.level + 1;
        
        const entry1 = this._createEntry(recordType, rtFile.isFloat, l);
        const entry2 = this._createEntry(recordType, rtFile.isFloat, ll);

        const root = new RTChild(rootPage);
        root.dataPage.insertRecord(entry1);
        root.dataPage.insertRecord(entry2);
        root.dataPage.flush();
    }

    private _createEntry(recordType: RTRecordType, float: boolean, node: RTNode) {
        let recordHeader = new RTRecordHeader();
        recordHeader.keyLength = RTUtils.sizeOfRecordType(recordType, float);
        recordHeader.elementLength = 0;
        recordHeader.childNodeId = node.dataPage.pageNo;
        const rect = node.dataPage.envelope();
        const entry = new RTEntryRecord(recordHeader, rect);
        return entry;
    }

    private _moveNodeToEnd(node: RTNode) {
        node.pageNo = this.dataPage.freePageNo;
        node.dataPage.flush();
    }

    delete(record: RTRecord) {
        const leafInfo = new RTLeafInfo(-1, null);
        this._findLeaf(record, leafInfo);
        if (leafInfo.leaf !== null) {
            leafInfo.leaf._delete(leafInfo.id);
        }
    }

    private _delete(id: number) {
        this.dataPage.deleteRecord(id);
        this.dataPage.flush();
    }

    protected _findLeaf(record: RTRecord, leafInfo: RTLeafInfo): boolean {
        let result = false;
        const count = this.recordCount;
        const recordType = this.recordType;
        for (let i = 0; i < count; i++) {
            const subNode = this.subNode(i);
            if (subNode === null) {
                continue;
            }

            if (recordType === RTRecordType.point) {
                result = this._findLeafPointRecord(record, leafInfo, subNode);
            }
            else {
                result = this._findLeafRectangleRecord(record, leafInfo, subNode);
            }

            if (result) {
                break;
            }
        }

        return result;
    }

    private _findLeafRectangleRecord(record: RTRecord, leafInfo: RTLeafInfo, subNode: RTNode): boolean {
        let success = false;
        leafInfo.leaf = null;
        const recordRect = record.envelope();
        if (subNode.contains(recordRect)) {
            success = subNode._findLeaf(record, leafInfo);
        }

        return success;
    }

    private _findLeafPointRecord(record: RTRecord, leafInfo: RTLeafInfo, subNode: RTNode): boolean {
        let success = false;
        leafInfo.leaf = null;
        const nodeRect = subNode.envelope();
        const point = record.point();
        if (nodeRect.contains(point)) {
            success = subNode._findLeaf(record, leafInfo);
        }

        return success;
    }
}

/** @ignore */
export class RTChild extends RTNode {
    constructor(dataPage: RTChildPage) {
        super(dataPage);
    }

    protected splitNode(record: RTRecord, nodeList: RTNode[]) {
        const rtFile = this.dataPage.rtFile;
        const recordType = this.dataPage.recordType;

        const childLeft = this._createChildNode(rtFile, recordType);
        const childRight = this._createChildNode(rtFile, recordType);
        const childList = [childLeft, childRight];
        this._splitNode(record, childList, nodeList);
    }

    private _createChildNode(rtFile: RTFile, recordType: RTRecordType) {
        const childPage = new RTChildPage(rtFile, recordType);
        const childNode = new RTChild(childPage);
        return childNode;
    }
}

/** @ignore */
export class RTLeaf extends RTNode {
    constructor(dataPage: RTLeafPage) {
        super(dataPage);
    }

    fillAll(ids: number[]): number {
        const count = this.recordCount;
        let record = this.firstRecord;
        while (record != null) {
            const id = record.data;
            ids.push(id);
            record = this.nextRecord;
        }

        return count;
    }

    fillContains(rect: IEnvelope, ids: number[]): number {
        let count = 0;
        let record = this.firstRecord;
        while(record !== null) {
            if (record.contains(rect)) {
                count ++;
                ids.push(record.data);
            }

            record = this.nextRecord;
        }

        return count;
    }

    fillOverlaps(rect: IEnvelope, ids: number[]): number {
        let count = 0;
        let record = this.firstRecord;
        while(record !== null) {
            if (record.overlaps(rect)) {
                count ++;
                ids.push(record.data);
            }

            record = this.nextRecord;
        }

        return count;
    }

    insertRecord(record: RTRecord, nodeList: RTNode[]) {
        this._insertRecord(record, nodeList);
    }

    protected _findLeaf(record: RTRecord, leafInfo: RTLeafInfo): boolean {
        let success = false;
        leafInfo.leaf = null;

        const recordCount = this.recordCount;
        for (let i = 0; i < recordCount; i++) {
            const tmpRecord = this.record(i)!;
            const recordType = this.recordType;
            if (recordType === RTRecordType.point) {
                const currentPoint = tmpRecord.point();
                const deletingPoint = record.point();
                if (currentPoint.equals(deletingPoint)) {
                    leafInfo.id = i;
                    leafInfo.leaf = this;
                    success = true;
                    return success;
                }
            }
            else {
                const currentRect = tmpRecord.envelope();
                const deletingRect = record.envelope();
                if (Envelope.equals(currentRect, deletingRect)) {
                    leafInfo.id = i;
                    leafInfo.leaf = this;
                    success = true;
                    return success;
                }
            }
        }

        return success;
    }

    protected splitNode(record: RTRecord, nodeList: RTNode[]) {
        nodeList.length = 0;
        const rtFile = this.dataPage.rtFile;
        const recordType = this.dataPage.recordType;
        const leafLeft = this._createLeafNode(rtFile, recordType);
        const leafRight = this._createLeafNode(rtFile, recordType);
        const leafList = [leafLeft, leafRight];
        this._splitNode(record, leafList, nodeList);
    }

    private _createLeafNode(rtFile: RTFile, recordType: RTRecordType) {
        const leafPage = new RTLeafPage(rtFile, recordType);
        const leafNode = new RTLeaf(leafPage);
        return leafNode;
    }
}

class RTLeafInfo {
    constructor(public id: number, public leaf: RTLeaf | null) {
    }
}

class RTLeafRecordInfo {
    constructor(public leaf: RTLeaf, public recordId: number, public featureId: string) {
    }
}