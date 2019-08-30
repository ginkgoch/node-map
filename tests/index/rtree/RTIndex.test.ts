import path from 'path';
import fs from 'fs';
import { RTIndex } from "../../../src/index/rtree/RTIndex";
import { RTGeomType } from '../../../src/index/rtree/RTGeomType';
import { ShapefileFeatureSource } from "../../.";
import { Point } from 'ginkgoch-geom';

describe('RTIndex', () => {
    const idxFileFolder = './tests/data/index/';

    it('create', () => {
        const idxFilePath = path.join(idxFileFolder, 'index-create-tmp.idx');

        try {
            RTIndex.create(idxFilePath, RTGeomType.point);
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
        try {
            RTIndex.create(idxFilePath, RTGeomType.point, true);
            const index = new RTIndex(idxFilePath, 'rs+');
            index.open();

            const features = await fetchPointFeatures(shpFilePath);
            for(let i = 0; i < features.length; i++) {
                const feature = features[i];
                const point = feature.geometry as Point;
                index.push(point, feature.id.toString());
            }

            index.close();
            index.flag = 'rs';
            index.open();
            expect(index.count).toBe(478);
        }
        finally {
            cleanIndexFiles(idxFilePath);
        }
    });

    it('create rect index - simple', () => {
        const idxFilePath = path.join(idxFileFolder, 'index-create-rect-simple-tmp.idx');

        try {
            RTIndex.create(idxFilePath, RTGeomType.point, true);
            const index = new RTIndex(idxFilePath, 'rs+');
            index.open();

            
            index.push({ minx: -180, miny: -90, maxx: -160, maxy: -70 }, '1');
            index.push({ minx: -180, miny: 70, maxx: -160, maxy: 90 }, '2');
            index.push({ minx: 160, miny: 70, maxx: 180, maxy: 90 }, '3');
            index.push({ minx: 160, miny: -90, maxx: 180, maxy: -70 }, '4');

            index.close();
            index.flag = 'rs';
            index.open();
            expect(index.count).toBe(4);
        }
        finally {
            cleanIndexFiles(idxFilePath);
        }

    });

    it('create point index - simple', () => {
        const idxFilePath = path.join(idxFileFolder, 'index-create-point-simple-tmp.idx');

        try {
            RTIndex.create(idxFilePath, RTGeomType.point, true);
            const index = new RTIndex(idxFilePath, 'rs+');
            index.open();

            
            index.push(new Point(-180, -90), '1');
            index.push(new Point(-180, 90), '2');
            index.push(new Point(180, -90), '3');
            index.push(new Point(180, 90), '4');

            index.close();
            index.flag = 'rs';
            index.open();
            expect(index.count).toBe(4);
        }
        finally {
            cleanIndexFiles(idxFilePath);
        }

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
    await source.open();
    const features = await source.features();
    return features;
}