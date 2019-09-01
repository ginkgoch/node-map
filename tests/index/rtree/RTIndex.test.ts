import fs from 'fs';
import path from 'path';
import _ from 'lodash';

import { RTIndex, RTRecordType } from "../../../src/indices";
import { ShapefileFeatureSource } from "../../.";
import { Point } from 'ginkgoch-geom';

describe('RTIndex', () => {
    const idxFileFolder = './tests/data/index/';
    const dataFolder = './tests/data/layers';

    it('create', () => {
        const idxFilePath = path.join(idxFileFolder, 'index-create-tmp.idx');

        try {
            RTIndex.create(idxFilePath, RTRecordType.point);
            expect(fs.existsSync(idxFilePath)).toBeTruthy();
        }
        finally {
            cleanIndexFiles(idxFilePath);
        }
    });

    it('read cities', async () => {
        const shpFilePath = path.join(idxFileFolder, 'cities.shp');
        const features = await fetchPointFeatures(shpFilePath);
        expect(features.length).toBe(478);
    });

    it('create point index', async () => {
        const idxFilePath = path.join(idxFileFolder, 'index-create-point-tmp.idx');
        const shpFilePath = path.join(idxFileFolder, 'cities.shp');

        cleanIndexFiles(idxFilePath);

        try {
            RTIndex.create(idxFilePath, RTRecordType.point);
            const index = new RTIndex(idxFilePath, 'rs+');
            index.open();

            const features = await fetchPointFeatures(shpFilePath);
            for (let i = 0; i < features.length; i++) {
                const feature = features[i];
                const point = feature.geometry as Point;
                index.push(point, feature.id.toString());
            }

            index.close();
            index.flag = 'rs';
            index.open();
            expect(index.count()).toBe(478);
        }
        finally {
            cleanIndexFiles(idxFilePath);
        }
    });

    function checkIndexBasicQueryResult(index: RTIndex, expectedCount: number) {
        const ids = index.intersections({ minx: -1e10, miny: -1e10, maxx: 1e10, maxy: 1e10 }).map(i => parseInt(i));
        expect(ids.length).toBe(expectedCount);
        expect(_.max(ids)).toBe(expectedCount);
        expect(_.min(ids)).toBe(1);
        expect(_.uniq(ids).length).toBe(expectedCount);
    }

    it('point index read', () => {
        const idxFilePath = path.join(idxFileFolder, 'cities.idx');
        const index = new RTIndex(idxFilePath, 'rs');
        index.open();
        expect(index.count()).toBe(478);

        checkIndexBasicQueryResult(index, 478);
    });

    it('create rect index - simple', () => {
        const idxFilePath = path.join(idxFileFolder, 'index-create-rect-simple-tmp.idx');

        try {
            RTIndex.create(idxFilePath, RTRecordType.point);
            const index = new RTIndex(idxFilePath, 'rs+');
            index.open();
            index.push({ minx: -180, miny: -90, maxx: -160, maxy: -70 }, '1');
            index.push({ minx: -180, miny: 70, maxx: -160, maxy: 90 }, '2');
            index.push({ minx: 160, miny: 70, maxx: 180, maxy: 90 }, '3');
            index.push({ minx: 160, miny: -90, maxx: 180, maxy: -70 }, '4');
            index.close();

            index.flag = 'rs';
            index.open();
            expect(index.count()).toBe(4);
        }
        finally {
            cleanIndexFiles(idxFilePath);
        }

    });

    it('create point index - simple', () => {
        const idxFilePath = path.join(idxFileFolder, 'index-create-point-simple-tmp.idx');

        try {
            RTIndex.create(idxFilePath, RTRecordType.point);
            const index = new RTIndex(idxFilePath, 'rs+');
            expect(index.flag).toEqual('rs+')
            index.open();

            index.push(new Point(-180, -90), '1');
            index.push(new Point(-180, 90), '2');
            index.push(new Point(180, -90), '3');
            index.push(new Point(180, 90), '4');

            index.close();
            index.open('rs');
            expect(index.flag).toEqual('rs');
            expect(index.count()).toBe(4);
        }
        finally {
            cleanIndexFiles(idxFilePath);
        }

    });

    it('create rect index', async () => {
        const shpFilePath = path.join(dataFolder, 'USStates.shp');
        const idxFilePath = path.join(idxFileFolder, 'us-states-index-demo.idx');
        cleanIndexFiles(idxFilePath);

        const features = await fetchPointFeatures(shpFilePath);
        RTIndex.create(idxFilePath, RTRecordType.rectangle);
        let idx = new RTIndex(idxFilePath, 'rs+');

        try {
            idx.open();
            features.forEach(f => idx.push(f.envelope(), f.id.toString()));
            idx.close();

            idx.open('rs');
            const idxCount = idx.count();
            expect(idxCount).toBe(51);
        }
        finally {
            if (idx !== undefined) {
                idx.close();
            }
            cleanIndexFiles(idxFilePath);
        }
    });

    it('read rect index', () => {
        const idxFilePath = path.join(dataFolder, 'USStates.idx');
        const idx = new RTIndex(idxFilePath);

        try {
            idx.open();
            checkIndexBasicQueryResult(idx, 51);
        }
        finally {
            idx.close();
        }
    });

    it('default create option', () => {
        const rtIndex = <any>RTIndex;
        let option = rtIndex._defaultCreateOptions();
        expect(option.pageSize).toBe(8192);
        expect(option.overwrite).toBeFalsy();
        expect(option.float).toBeTruthy();

        option = rtIndex._defaultCreateOptions({});
        expect(option.pageSize).toBe(8192);
        expect(option.overwrite).toBeFalsy();
        expect(option.float).toBeTruthy();

        option = rtIndex._defaultCreateOptions({ pageSize: 4096 });
        expect(option.pageSize).toBe(4096);
        expect(option.overwrite).toBeFalsy();
        expect(option.float).toBeTruthy();

        option = rtIndex._defaultCreateOptions({ overwrite: true, float: false });
        expect(option.pageSize).toBe(8192);
        expect(option.overwrite).toBeTruthy();
        expect(option.float).toBeFalsy();

        option = rtIndex._defaultCreateOptions({ overwrite: true, pageSize: 4096, float: false });
        expect(option.pageSize).toBe(4096);
        expect(option.overwrite).toBeTruthy();
        expect(option.float).toBeFalsy();
    });

    it('exists', () => {
        let filePath = './tests/data/index/cities.shp';
        let result = RTIndex.exists(filePath);
        expect(result).toBeTruthy();

        filePath = './tests/data/index/cities.dbf';
        result = RTIndex.exists(filePath);
        expect(result).toBeTruthy();

        filePath = './tests/data/index/cities1.dbf';
        result = RTIndex.exists(filePath);
        expect(result).toBeFalsy();
    });

    it('count - complex', async () => {
        const shpFilePath = '/Users/howardch/Downloads/test-data/test2/evergreen1.shp';
        const idxFilePath = '/Users/howardch/Downloads/test-data/test2/evergreen1.idx';
        let idx = new RTIndex(idxFilePath);
        idx.open();
        console.log(idx.count());

        // let shp = new ShapefileFeatureSource(shpFilePath);
        // await shp.open()
        // console.log(await shp.count());

        // let features = await shp.features();
        // console.log(features.length);
    });
});

function cleanIndexFiles(basePath: string) {
    ['.idx', '.ids'].forEach(ext => {
        const filePath = basePath.replace(/\.idx$/i, ext);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    });
}

async function fetchPointFeatures(filePath: string) {
    const source = new ShapefileFeatureSource(filePath);

    try {
        await source.open();
        const features = await source.features();
        return features;
    }
    finally {
        await source.close();
    }
}