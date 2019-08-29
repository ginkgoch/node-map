import path from 'path';
import fs from 'fs';
import { RTIndex } from "../../../src/index/rtree/RTIndex";
import { RTGeomType } from '../../../src/index/rtree/RTGeomType';

describe('RTIndex', () => {
    const idxFileFolder = './tests/data/index/'

    it('create', () => {
        const idxFilePath = path.join(idxFileFolder, 'index-create-tmp.idx');

        try {
            RTIndex.create(idxFilePath, RTGeomType.point);
            expect(fs.existsSync(idxFilePath)).toBeTruthy();
        }
        finally {
            ['.idx', '.ids'].forEach(ext => {
                const filePath = idxFilePath.replace(/\.idx$/i, ext);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }
    });
});