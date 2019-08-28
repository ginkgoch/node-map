import { RTDataPage, RTLeafPage } from "./RTPage";
import { RTGeomType } from "./RTGeomType";
import { NotImplementedError, RTConstants, RTUtils } from "./RTUtils";
import { RTRecord, RTRectangle, RTEntryRecord } from "./RTRecord";
import { Envelope, IEnvelope } from "ginkgoch-geom";

export class RTNode {
    dataPage: RTDataPage;
    cursor = 0;

    constructor(dataPage: RTDataPage) {
        this.dataPage = dataPage;
    }

    static create(dataPage: RTDataPage): RTNode {
        const level = dataPage.level;
        if (level === 1) {
            const leafPage = new RTLeafPage(dataPage.rtFile, dataPage.pageNo, dataPage.geomType);
        }
        else {
        }
        throw new NotImplementedError();
    }

    get geomType(): RTGeomType {
        return this.dataPage.geomType;
    }

    get recordCount(): number {
        return this.dataPage.recordCount;
    }

    check(): boolean {
        throw new NotImplementedError();
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
        const geomType = this.dataPage.geomType;
        const dataPage = new RTDataPage(rtFile, geomType, child);
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
        this.dataPage.pageNo = pageNo;
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
        let count =  this.recordCount;
        if (this.isLeaf) {
            return count;
        }

        const currentCount = count;
        for (let i = 0; i < currentCount; i++) {
            const node = this.subNode(i);
            if (node === null) {
                continue;
            }

            count += node.allRecordCount;
        }

        return count;
    }

    get envelope(): RTRectangle {
        return this.dataPage.envelope;
    }

    record(id: number): RTRecord | null {
        return this.dataPage.record(id);
    }

    contains(rect: IEnvelope) {
        const currentRect = this.envelope;
        return Envelope.contains(currentRect, rect);
    }

    isContained(rect: IEnvelope) {
        const currentRect = this.envelope;
        return Envelope.contains(rect, currentRect);
    }

    overlaps(rect: IEnvelope) {
        const currentRect = this.envelope;
        return Envelope.overlaps(currentRect, rect);
    }

    fillAll(ids: string[]): number {
        let count = 0;
        let recordCount = this.recordCount;
        for (let i = 0; i < recordCount; i++) {
            const subNode = this.subNode(i)!;
            count += subNode.fillAll(ids);
        }

        return count;
    }

    fillContains(rect: IEnvelope, ids: string[]): number {
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

    fillOverlaps(rect: IEnvelope, ids: string[]): number {
        let count = 0;
        if (!this.overlaps(rect)) {
            return count;
        }

        if (this.isContained(rect)) {
            count = this.fillAll(ids);
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
        const pageNo = this.pageNo;
        return pageNo === 1;
    }

    get isLeaf(): boolean {
        const level = this.level;
        return level === 1;
    }

    get isChild(): boolean {
        return !this.isLeaf;
    }

    quadSplit(rectList: RTRectangle[]): number[][] {
        const spRectList = new Array<number>();
        for (let i = 0; i < rectList.length; i++) {
            spRectList.push(i);
        }

        let min = Math.round(this.dataPage.maxRecordCount() * RTConstants.FILL_FACTOR);
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

        const mbr1 = rectArr[seeds[0]];
        const mbr2 = rectArr[seeds[1]];

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

    pickNext(rectArr: RTRectangle[], spRectList: number[], leftRectList: number[], rightRectList: number[], mbr1: RTRectangle, mbr2: RTRectangle) {
        let diff = Number.MIN_VALUE;
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
    }

    addRest(spRectList: number[], rectList: number[]) {
        for (let i = 0; i < spRectList.length; i++) {
            const id = spRectList[i];
            rectList.push(id);
            RTUtils.remove(spRectList, id);
        }
    }

    pickSeeds(rectArr: RTRectangle[]): number[] {
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

    static adjustTree(node: RTNode, id: number, splitted: boolean) {
        const childNode = node.subNode(id);
        if (childNode === null) {
            return;
        }

        const entry = node.record(id) as RTEntryRecord;
        if (entry === null) {
            return;
        }

        if (splitted) {
            entry.rectangle = childNode.envelope;
            this.updateEntry(node, entry, id);
        }
        else {
            const entryRect = entry.envelope();
            const childRect = childNode.envelope;
            if (!Envelope.contains(entryRect, childRect)) {
                entry.rectangle = childRect;
                this.updateEntry(node, entry, id);
            }
        }
    }

    static updateEntry(node: RTNode, entry: RTEntryRecord, id: number) {
        node.dataPage.updateEntry(entry, id);
        node.dataPage.flush();
    }

    findLeastEnlargement(rect: RTRectangle): number {
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

    insertRecord(record: RTRecord, nodeList: RTNode[]) {
        const subNodeList = new Array<RTNode>();
        const rect = record.envelope();
        const index = this.findLeastEnlargement(rect);
        const subNode = this.subNode(index);
        if (subNode === null) {
            return;
        }

        subNode.insertRecord(record, subNodeList);
        const splitted = subNodeList.length === 2;
        RTNode.adjustTree(this, index, splitted);

        if (splitted) {
            const entry = <RTEntryRecord>this.firstRecord;
            const entryHeader = entry.header;
            entryHeader.childNodeId = subNodeList[1].pageNo;
            entry.rectangle = subNodeList[1].envelope;
            this.insertRecordInThisNode(entry, nodeList);
        }
    }

    insertRecordInThisNode(record: RTRecord, nodeList: RTNode[]) {
        const capacity = this.dataPage.maxRecordCount();
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

    splitNodeByType(record: RTRecord, nodeListIn: RTNode[], nodeListOut: RTNode[]) {
        nodeListOut.length = 0;
        const recordCount = this.recordCount;
        const count = recordCount + 1;
        const recArr = new Array<RTRecord>();
        const rectList = new Array<RTRectangle>();
        const rtArr = new Array<RTRectangle>();

        for (let i = 0; i < recordCount; i++) {
            const currentRecord = this.record(i)!;
            const currentRecordRect = currentRecord.envelope();
            recArr.push(currentRecord);
            rtArr.push(currentRecordRect);
            rectList.push(currentRecordRect);
        }

        const recordRect = record.envelope();
        recArr.push(record);
        rtArr.push(recordRect);
        rectList.push(recordRect);

        const spList = this.quadSplit(rectList);
        const curPageNo = this.pageNo;
        const level = this.level;

        nodeListIn[0].pageNo = curPageNo;
        nodeListIn[0].level = level;
        for (let i = 0; i < spList[0].length; i++) {
            const id = spList[0][i];
            nodeListIn[0].dataPage.insertRecord(recArr[id]);
        }

        nodeListIn[0].dataPage.flush();
        const newPageNo = this.freePageNo;
        nodeListIn[1].pageNo = newPageNo;
        nodeListIn[1].level = level;

        for (let i = 0; i < spList[1].length; i++) {
            const id = spList[1][i];
            nodeListIn[1].dataPage.insertRecord(recArr[id]);
        }

        nodeListIn[1].dataPage.flush();
        nodeListIn.forEach(n => nodeListOut.push(n));
    }

    private get freePageNo() {
        return this.dataPage.freePageNo;
    }

    splitNode(record: RTRecord, nodeList: RTNode[]) {
        nodeList.length = 0;
    }

    splitRoot(nodes: RTNode[]) {
        const leftNode = nodes[0];
        //TODO
    }
}