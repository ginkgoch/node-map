import { RTIndex, RTRecordType, ShapefileFeatureSource } from '.';
import fs from 'fs';
import _ from 'lodash';

const sourceFilePath = '/Users/howardchen/Desktop/TestData1/evergreen.shp'

async function readCount() {
    const idxFilePath = sourceFilePath;
    let idx = new RTIndex(idxFilePath, 'rs+');
    idx.open();
    console.log(idx.count());
}

async function main() {
    const shpFilePath = sourceFilePath;
    const idxFilePath = sourceFilePath.replace('.shp', '.idx');
    
    const features = await fetchPointFeatures(shpFilePath);
    const featureCount = features.length;
    console.log(featureCount);
    
    ['.idx', '.ids'].forEach(ext => { 
        if (fs.existsSync(idxFilePath.replace('.idx', ext)))
            fs.unlinkSync(idxFilePath.replace('.idx', ext))
    });

    RTIndex.create(idxFilePath, RTRecordType.rectangle, {overwrite: true});
    let idx = new RTIndex(idxFilePath, 'rs+');

    try {
        idx.open();

        for (let i = 0; i < featureCount; i++) {
            process.stdout.write(`Building ${i + 1}/${featureCount} \r`);

            const f = features[i];
            const envelope = f.geometry.envelope();
            idx.push(envelope, f.id.toString());
        }
        idx.close();

        idx.open('rs');
        const idxCount = idx.count();
        console.log(idxCount);
    }
    catch (e) {
        console.log(e);
    }
    finally {
        if (idx !== undefined) {
            idx.close();
        }
    }
}

async function fetchPointFeatures(filePath: string) {
    const source = new ShapefileFeatureSource(filePath);
    source.indexEnabled = false;

    try {
        await source.open();
        const featureCount = await source.count();
        const features = await source.features(undefined, []);

        const fff = _.take(features, 500);
        console.log(fff.length);

        return features;
    }
    finally {
        await source.close();
    }
}

main();
// readCount();