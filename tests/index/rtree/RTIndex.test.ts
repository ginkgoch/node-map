import path from 'path';
import fs from 'fs';
import { RTIndex } from "../../../src/index/rtree/RTIndex";
import { RTGeomType } from '../../../src/index/rtree/RTGeomType';

describe('RTIndex', () => {
    const idxFileFolder = './tests/data/index/'

    it('create', () => {
        const idxFilePath = path.join(idxFileFolder, 'index-create-tmp.idx');
        RTIndex.create(idxFilePath, RTGeomType.point);

        expect(fs.existsSync(idxFilePath)).toBeTruthy();
    });
});