const { RTIndex, RTRecordType, ShapefileFeatureSource } = require('./dist/bundle');
const { Point } = require('ginkgoch-geom');
const fs = require('fs');

async function readCount() {
    const idxFilePath = '/Users/howardch/Downloads/test-data/test2/evergreen1.idx';
    let idx = new RTIndex(idxFilePath, 'rs+');
    idx.open();
    console.log(idx.count());
}

async function main() {
    const shpFilePath = '/Users/howardch/Downloads/test-data/test2/evergreen1.shp';
    const idxFilePath = '/Users/howardch/Downloads/test-data/test2/evergreen1.idx';
    
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
            i++;

            if (f.id !== i) {
                console.log(f.id);
            }
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

async function fetchPointFeatures(filePath) {
    const source = new ShapefileFeatureSource(filePath);
    source.indexEnabled = false;

    try {
        await source.open();
        const featureCount = await source.count();
        const features = await source.features();
        return features;
    }
    finally {
        await source.close();
    }
}

main();
// readCount();