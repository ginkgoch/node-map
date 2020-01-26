import { ShapefileFeatureSource, FieldFilters } from "../../src";

describe('FeatureSource', () => {
    it('normalizeField', async () => {
        const filePath = './tests/data/layers/USStates.shp';
        let source = new DynamicShpSource(filePath);
        source.dynamicFields.push({ name: 'STATE_FULL', fieldsDependOn: ['STATE_NAME', 'STATE_ABBR'], mapper: f => {
            return `${f.properties.get('STATE_NAME')} (${f.properties.get('STATE_ABBR')})`;
        } });

        await source.open();
        let fields = await source.normalizeFields('all');
        expect(fields.length).toBe(53);
        expect(fields.includes('STATE_FULL')).toBeTruthy();

        fields = await source.normalizeFields('none');
        expect(fields.length).toBe(0);

        fields = await source.normalizeFields(['STATE_FULL']);
        expect(fields.length).toBe(3);

        ['STATE_FULL', 'STATE_NAME', 'STATE_ABBR'].every(name => {
            expect(fields.includes(name)).toBeTruthy();
        });
    });
});

class DynamicShpSource extends ShapefileFeatureSource {
    constructor(filePath: string) {
        super(filePath);
    }

    public async normalizeFields(fields: FieldFilters): Promise<string[]> {
        return this._normalizeFields(fields);
    }
}