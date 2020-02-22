import fs from 'fs';
import { CSVFeatureSource, FeatureLayer, GeneralStyle, Render } from "..";
import TestUtils from "../shared/TestUtils";

const compareImage = TestUtils.compareImageFunc(name => './tests/data/layers/' + name);

describe('CSVFeatureSource', () => {
    it('open', async () => {
        let fieldOptions = { geomField: { x: 'longitude', y: 'latitude' }, hasFieldsRow: true };
        let source = new CSVFeatureSource('./tests/data/layers/airports.csv', fieldOptions);
        await source.open();

        let fields = await source.fields();
        expect(fields.length).toBe(5);
        expect(source.internalFeatures.length).toBe(198);
        await source.close();
    });

    it('open with wkt', async () => {
        let fieldOptions = { geomField: 'geom', hasFieldsRow: true };
        let source = new CSVFeatureSource('./tests/data/layers/csv-wkt.csv', fieldOptions);
        source.delimiter = ';';
        await source.open();

        let fields = await source.fields();
        expect(fields.length).toBe(4);
        expect(source.internalFeatures.length).toBe(3);
        await source.close();
    });

    it('open with wkt but no column row', async () => {
        let fieldOptions = { geomField: 'geom', fields: 'id;name;amount;city;geom'.split(';'), hasFieldsRow: false };
        let source = new CSVFeatureSource('./tests/data/layers/csv-wkt-no-field.csv', fieldOptions);
        source.delimiter = ';';
        await source.open();

        let fields = await source.fields();
        expect(fields.length).toBe(4);
        expect(source.internalFeatures.length).toBe(3);
        await source.close();
    });

    it('draw', async () => {
        let fieldOptions = { geomField: { x: 'longitude', y: 'latitude' }, hasFieldsRow: true };
        let source = new CSVFeatureSource('./tests/data/layers/airports.csv', fieldOptions);

        let layer = new FeatureLayer(source);
        layer.styles.push(new GeneralStyle('#e34a33', 'cccc', 1, 4));

        await layer.open();
        const envelope = await layer.envelope();
        const render = Render.create(256, 256, envelope);
        render.drawBackground('white');
        await layer.draw(render);
        render.flush();

        compareImage(render.image, 'airports.png');
        await layer.close();
    });

    it('json', async () => {
        let fieldOptions = { geomField: { x: 'longitude', y: 'latitude' }, hasFieldsRow: true };
        let oldSource = new CSVFeatureSource('./tests/data/layers/airports.csv', fieldOptions);
        let json = oldSource.toJSON();

        let source = CSVFeatureSource.parseJSON(json);
        await source.open();

        let fields = await source.fields();
        expect(fields.length).toBe(5);
        expect(source.internalFeatures.length).toBe(198);
        await source.close();
    });

    it('create', async () => {
        let fieldOptions = { geomField: { x: 'longitude', y: 'latitude' }, hasFieldsRow: true };
        let source = new CSVFeatureSource('./tests/data/layers/airports.csv', fieldOptions);
        await source.open();

        let features = await source.features();
        let fields = await source.fields();

        let filePathNew = './tests/data/layers/TMP_airports_create.csv';
        let fieldOptionsNew = { fields: fields.map(f => f.name), geomField: { x: 'longitude', y: 'latitude' } };

        try {
            CSVFeatureSource.create(filePathNew, ',', fieldOptionsNew, features);

            let sourceNew = new CSVFeatureSource(filePathNew, fieldOptions);
            expect(sourceNew.name).toEqual('TMP_airports_create');

            await sourceNew.open();
            let featuresNew = await sourceNew.features();
            expect(featuresNew.length).toBe(features.length);
        }
        finally {
            fs.unlinkSync(filePathNew);
        }
    });
})
