import _ from "lodash";
import { RTDataPage, RTLeafPage, RTChildPage } from "./RTPage";
import { RTGeomType } from "./RTGeomType";
import { RTConstants, RTUtils } from "./RTUtils";
import { RTRecord, RTRectangle, RTEntryRecord, RTRecordHeader } from "./RTRecord";
import { Envelope, IEnvelope } from "ginkgoch-geom";
import { RTIds } from "./RTIds";

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
            const leafPage = new RTLeafPage(dataPage.rtFile, dataPage.geomType, dataPage.pageNo);
            node = new RTLeaf(leafPage);
        }
        else {
            const childPage = new RTChildPage(dataPage.rtFile, dataPage.geomType, dataPage.pageNo);
            node = new RTChild(childPage);
        }
        return node;
    }

    get geomType(): RTGeomType {
        return this.dataPage.geomType;
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
        const l = nodes[0];
        const ll = nodes[1];
        this.moveNodeToLast(l);

        const rtFile = this.dataPage.rtFile;
        const geomType = this.dataPage.geomType;
        const rootPage = new RTChildPage(rtFile, geomType);
        rootPage.setPageNo(1);
        rootPage.level = l.level + 1;

        const root = new RTChild(rootPage);

        let recordHeader = new RTRecordHeader();
        recordHeader.keyLength = RTUtils.sizeOfGeom(geomType, rtFile.isFloat);
        recordHeader.elementLength = 0;
        recordHeader.childNodeId = l.dataPage.pageNo;
        const rt1 = l.dataPage.envelope;
        const rt2 = ll.dataPage.envelope;
        const entry1 = new RTEntryRecord(recordHeader, rt1);

        recordHeader = _.clone(recordHeader);
        recordHeader.childNodeId = ll.dataPage.pageNo;
        const entry2 = new RTEntryRecord(recordHeader, rt2);

        root.dataPage.insertRecord(entry1);
        root.dataPage.insertRecord(entry2);
        root.dataPage.flush();
    }

    moveNodeToLast(node: RTNode) {
        node.pageNo = this.dataPage.freePageNo;
        node.dataPage.flush();
    }

    delete(record: RTRecord) {
        const leafInfo = new RTLeafInfo(-1, null);
        this.findLeaf(record, leafInfo);
        if (leafInfo.leaf !== null) {
            leafInfo.leaf.deleteRecord(leafInfo.id);
        }
    }

    deleteByIds(record: RTRecord, ids: string[], idsEngine: RTIds) {
        const leaves = new Array<RTLeafRecordInfo>();
        this.findLeaves(record, leaves, idsEngine);
        leaves.filter(leaf => ids.indexOf(leaf.featureId) >= 0).forEach(leaf => {
            if (leaf.recordId !== -1 && leaf.leaf !== null) {
                leaf.leaf.deleteRecord(leaf.recordId);
            }
        });
    }

    deleteRecord(id: number) {
        this.dataPage.deleteRecord(id);
        this.dataPage.flush();
    }

    findLeaf(record: RTRecord, leafInfo: RTLeafInfo): boolean {
        let result = false;
        const count = this.recordCount;
        const geomType = this.geomType;
        for (let i = 0; i < count; i++) {
            const subNode = this.subNode(i);
            if (subNode === null) {
                continue;
            }

            if (geomType === RTGeomType.point) {
                result = this.findLeafPointRecord(record, leafInfo, subNode);
            }
            else {
                result = this.findLeafRectangleRecord(record, leafInfo, subNode);
            }

            if (result) {
                break;
            }
        }

        return result;
    }

    findLeafRectangleRecord(record: RTRecord, leafInfo: RTLeafInfo, subNode: RTNode): boolean {
        let success = false;
        leafInfo.leaf = null;
        const recordRect = record.envelope();
        if (subNode.contains(recordRect)) {
            success = subNode.findLeaf(record, leafInfo);
        }

        return success;
    }

    findLeafPointRecord(record: RTRecord, leafInfo: RTLeafInfo, subNode: RTNode): boolean {
        let success = false;
        leafInfo.leaf = null;
        const nodeRect = subNode.envelope;
        const point = record.point();
        if (nodeRect.contains(point)) {
            success = subNode.findLeaf(record, leafInfo);
        }

        return success;
    }

    findLeaves(record: RTRecord, leaves: RTLeafRecordInfo[], idsEngine: RTIds) {
        const count = this.recordCount;
        const geomType = this.geomType;
        for (let i = 0; i < count; i++) {
            const subNode = this.subNode(i);
            if (subNode === null) {
                continue;
            }

            if (geomType === RTGeomType.point) {
                this.findLeafPointRecords(record, subNode, leaves, idsEngine);
            }
            else {
                this.findLeafRectangleRecords(record, subNode, leaves, idsEngine);
            }
        }
    }

    findLeafRectangleRecords(record: RTRecord, subNode: RTNode, leaves: RTLeafRecordInfo[], idsEngine: RTIds) {
        const rect = record.envelope();
        if (subNode.contains(rect)) {
            const leafInfo = new RTLeafInfo(-1, null);
            const success = subNode.findLeaf(record, leafInfo);
            if (success) {
                const id = idsEngine.id(leafInfo.id);
                leaves.push(new RTLeafRecordInfo(leafInfo.leaf!, leafInfo.id, id));
            }
        }
    }

    findLeafPointRecords(record: RTRecord, subNode: RTNode, leaves: RTLeafRecordInfo[], idsEngine: RTIds) {
        const nodeRect = subNode.envelope;
        const point = record.point();
        if (nodeRect.contains(point)) {
            const leafInfo = new RTLeafInfo(-1, null);
            const success = subNode.findLeaf(record, leafInfo);
            if (success) {
                const id = idsEngine.id(leafInfo.id);
                leaves.push(new RTLeafRecordInfo(leafInfo.leaf!, leafInfo.id, id));
            }
        }
    }
}

export class RTChild extends RTNode {
    constructor(dataPage: RTChildPage) {
        super(dataPage);
    }

    splitNode(record: RTRecord, nodeList: RTNode[]) {
        const rtFile = this.dataPage.rtFile;
        const geomType = this.dataPage.geomType;
        const childPageLeft = new RTChildPage(rtFile, geomType);
        const childLeft = new RTChild(childPageLeft);

        const childPageRight = new RTChildPage(rtFile, geomType);
        const childRight = new RTChild(childPageRight);

        const childList = [childLeft, childRight];
        this.splitNodeByType(record, childList, nodeList);
    }
}

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
        this.insertRecordInThisNode(record, nodeList);
    }

    splitNode(record: RTRecord, nodeList: RTNode[]) {
        const rtFile = this.dataPage.rtFile;
        const geomType = this.dataPage.geomType;
        const leafPageLeft = new RTLeafPage(rtFile, geomType);
        const leafLeft = new RTLeaf(leafPageLeft);

        const leafPageRight = new RTLeafPage(rtFile, geomType);
        const leafRight = new RTLeaf(leafPageRight);

        const leafList = [leafLeft, leafRight];
        this.splitNodeByType(record, leafList, nodeList);
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