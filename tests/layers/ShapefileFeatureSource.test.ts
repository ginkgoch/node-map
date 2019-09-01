import { DbfField, DbfFieldType, ShapefileType } from 'ginkgoch-shapefile';
import { ShapefileFeatureSource, Field } from '../../src/layers';
import TestUtils from '../shared/TestUtils';

describe('ShapefileFeatureSource', () => {
    it('DbfField parsing', () => {
        const dbfField = new DbfField('STATE_NAME', DbfFieldType.number, 8, 4);

        const source = new ShapefileFeatureSource() as any;
        const field = source._mapDbfFieldToField(dbfField) as Field;
        expect(field.name).toEqual(dbfField.name);
        expect(field.length).toBe(dbfField.length);
        expect(field.type).toEqual('number');
        expect(field.extra.size).toBe(1);
        expect(field.extra.get('decimal')).toBe(4);

        const newDbfField = source._mapFieldToDbfField(field) as DbfField;
        expect(newDbfField).toEqual(dbfField);
    });

    it('editable', () => {
        const source = new ShapefileFeatureSource();
        expect(source.editable).toBeTruthy();
    });

    it('open with filePath empty', async () => {
        const source = new ShapefileFeatureSource();

        try {
            await source.open();
            expect(true).toBeFalsy();
        } catch (e) {
            expect(e.toString()).toMatch(/empty/);
        }
    });

    it('open with filePath not exist', async () => {
        const source = new ShapefileFeatureSource('./fileNotExist.shp');

        try {
            await source.open();
            expect(true).toBeFalsy();
        } catch (e) {
            expect(e.toString()).toMatch(/exist/);
        }
    });

    it('json', () => {
        const source = new ShapefileFeatureSource('./fileNotExist.shp');
        const json = source.toJSON();

        TestUtils.compareOrLog(json, {
            type: 'shapefile-feature-source',
            name: 'fileNotExist',
            projection:
            {
                from: { projection: undefined, unit: 'unknown' },
                to: { projection: undefined, unit: 'unknown' }
            },
            flag: 'rs',
            filePath: './fileNotExist.shp'
        }, false, false);
    });

    it('name', () => {
        let source = new ShapefileFeatureSource('./fileNotExist.shp');
        expect(source.name).toEqual('fileNotExist');

        source = new ShapefileFeatureSource('./fileNotExist.SHP');
        expect(source.name).toEqual('fileNotExist');

        source = new ShapefileFeatureSource('./fileNotExist.DBF');
        expect(source.name).toEqual('fileNotExist');

        source.filePath = './fileChanged.shp';
        expect(source.name).toEqual('fileNotExist');
    });

    it('shapeType', async () => {
        let source = new ShapefileFeatureSource('./tests/data/layers/USStates.shp');
        await source.open();
        let shapeType = source.shapeType;
        expect(shapeType).toEqual(ShapefileType.polygon);
        await source.close();

        source = new ShapefileFeatureSource('./tests/data/index/cities.shp');
        await source.open();
        shapeType = source.shapeType;
        expect(shapeType).toEqual(ShapefileType.point);
        await source.close();

    });
});