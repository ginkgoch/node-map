import { DbfField, DbfFieldType } from 'ginkgoch-shapefile';
import { ShapefileFeatureSource, Field } from '../../src/layers';
import { JsonKnownTypes } from '../../src/shared';
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
        const json = source.json();

        TestUtils.compareOrLog(json, {
            type: 'shapefile-feature-source',
            name: 'Unknown',
            projection:
            {
                from: { projection: undefined, unit: 0 },
                to: { projection: undefined, unit: 0 }
            },
            flag: 'rs',
            filePath: './fileNotExist.shp'
        }, false, false);
    });
});