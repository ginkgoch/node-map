import {RTIndex} from '../../../src/index/rtree/RTIndex';

describe('Ids', () => {
    it('readInt', () => {
        const buff = Buffer.alloc(4);
        buff.writeInt32LE(3987, 0);

        const i1 = buff[0] + buff[1] * 256 + buff[2] * 256 * 256 + buff[3] * 256 * 256 * 256;
        const i2 = buff.readInt32LE(0);
        expect(i2).toBe(i1);
    });

    it('arr ref', () => {
        const arr = ['Z'];
        fillContent(arr);
        expect(arr.length).toBe(3);
    });

    it('idx file path', () => {
        const idxFilePath = './test/file.idx';
        const idsFilePath = (<any>RTIndex)._idsFilePath(idxFilePath);
        expect(idsFilePath).toEqual('./test/file.ids');
    });
});

function fillContent(arr: string[]) {
    arr.push('A');
    arr.push('B');
}