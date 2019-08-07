import { Feature, Point } from "ginkgoch-geom";
import { MemoryFeatureSource } from "../../src/layers/MemoryFeatureSource";
import { Field } from "../../src/layers/Field";

describe('MemoryFeatureSource', () => {
    it('push feature', async () => {
        const source = new MemoryFeatureSource();
        await source.push(new Feature(new Point(0, 1)));
        await source.push(new Feature(new Point(1, 1)));

        const features = await source.features();
        expect(features.length).toBe(2);
        expect(features[0].id).toBe(1);
        expect(features[1].id).toBe(2);
    });

    it('update feature', async () => {
        const source = new MemoryFeatureSource();

        let points = [
            new Point(0, 1),
            new Point(1, 1)
        ]

        await source.push(new Feature(points[0]));
        await source.push(new Feature(points[1]));

        let updatingFeature = new Feature(new Point(1, 1), {}, 3);
        await source.update(updatingFeature);

        let features = await source.features();
        expect(features.length).toBe(2);
        expect(features[0].id).toBe(1);
        expect(features[1].id).toBe(2);
        
        for (let i = 0; i < features.length; i++) {
            expect(features[i].geometry).toEqual(points[i]);
        }

        updatingFeature = new Feature(new Point(19, 21), {}, 2);
        await source.update(updatingFeature);

        features = await source.features();
        expect(features.length).toBe(2);
        expect(features[0].id).toBe(1);
        expect(features[1].id).toBe(2);
        
        points[1] = new Point(19, 21);
        for (let i = 0; i < features.length; i++) {
            expect(features[i].geometry).toEqual(points[i]);
        }
    });

    it('remove feature', async () => {
        const source = new MemoryFeatureSource();
        await source.push(new Feature(new Point(0, 1)));
        await source.push(new Feature(new Point(1, 1)));

        let features = await source.features();
        expect(features.length).toBe(2);

        await source.remove(3);
        features = await source.features();
        expect(features.length).toBe(2);

        await source.remove(1);
        features = await source.features();
        expect(features.length).toBe(1);
        expect(features[0].geometry).toEqual(new Point(1, 1));
        expect(features[0].id).toBe(2);

        await source.push(new Feature(new Point(91, 19)));
        features = await source.features();
        expect(features.length).toBe(2);
        expect(features[1].id).toBe(3);
    });

    it('field - push', async () => {
        const source = new MemoryFeatureSource();
        const field1 = new Field('name', 'char', 10);
        const field2 = new Field('age', 'number', 4);        

        await source.pushField(field1);
        await source.pushField(field2);

        const fields = await source.fields();
        expect(fields.length).toBe(2);
        expect(fields[0]).toEqual(field1);
        expect(fields[1]).toEqual(field2);

        await source.push(new Feature(new Point(1, 1), { 'name': 'Samuel', 'age': 20, 'gender': 'male' }));
        let features = await source.features();
        expect(features.length).toBe(1);
        expect(features[0].properties.size).toBe(2);
        expect(features[0].properties.has('name')).toBeTruthy();
        expect(features[0].properties.has('age')).toBeTruthy();
        expect(features[0].properties.has('gender')).toBeFalsy();
    });

    it('field - update', async () => {
        const source = new MemoryFeatureSource();
        const field1 = new Field('name', 'char', 10);
        const field2 = new Field('age', 'number', 4);        

        await source.pushField(field1);
        await source.pushField(field2);

        let field3 = new Field('gender', 'char', 10);        
        await source.updateField('age', field3);
        const fields = await source.fields();
        expect(fields.length).toBe(2);
        expect(fields[0]).toEqual(field1);
        expect(fields[1]).toEqual(field3);
        
        await source.push(new Feature(new Point(1, 1), { 'name': 'Samuel', 'age': 20, 'gender': 'male' }));
        let features = await source.features();
        expect(features.length).toBe(1);
        expect(features[0].properties.size).toBe(2);
        expect(features[0].properties.has('name')).toBeTruthy();
        expect(features[0].properties.has('age')).toBeFalsy();
        expect(features[0].properties.has('gender')).toBeTruthy();
    });

    it('field - remove', async () => {
        const source = new MemoryFeatureSource();
        const field1 = new Field('name', 'char', 10);
        const field2 = new Field('age', 'number', 4);        

        await source.pushField(field1);
        await source.pushField(field2);
        let fields = await source.fields();
        expect(fields.length).toBe(2);

        await source.removeField('gender');
        fields = await source.fields();
        expect(fields.length).toBe(2);
        
        await source.removeField('age');
        fields = await source.fields();
        expect(fields.length).toBe(1);
    });
});