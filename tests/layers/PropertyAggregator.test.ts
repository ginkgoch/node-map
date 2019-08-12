import { ShapefileFeatureSource } from "../../src/layers";
import { PropertyAggregator } from "../../src/layers/PropertyAggregator";

describe('PropertyAggregator', () => {
    const filePath = './tests/data/layers/USStates.shp';

    it('select', async () => {
        await aggregate(filePath, 'HOUSEHOLDS', agg => {
            const result = agg.select('HOUSEHOLDS');
            expect(result.length).toBe(51);
        });
    });

    it('general', async () => {
        await aggregate(filePath, 'HOUSEHOLDS', agg => {
            const result = agg.general('HOUSEHOLDS');
            expect(result.average).toBe(1802890.3921568627);
            expect(result.count).toBe(51);
            expect(result.maximum).toBe(10381206);
            expect(result.minimum).toBe(168839);
            expect(result.sum).toBe(91947410);
        });
    });

    it('distinct', async () => {
        await aggregate(filePath, 'HOUSEHOLDS', agg => {
            const result = agg.distinct('HOUSEHOLDS');
            expect(result.length).toBe(51);
        });
    });

    it('distinct - sort', async () => {
        await aggregate(filePath, 'HOUSEHOLDS', agg => {
            const result = agg.distinct('HOUSEHOLDS', true);
            let previous = result[0];
            for (let i = 1; i < result.length; i++) {
                let current = result[i];
                expect(current).toBeGreaterThanOrEqual(previous);
            }
        });
    });
});

async function aggregate(filePath: string, field: string, action: (agg: PropertyAggregator) => void) {
    const source = new ShapefileFeatureSource(filePath);

        try {
            await source.open();
            const aggregator = await source.propertyAggregator([field]);
            action(aggregator);
        } finally {
            await source.close();
        }
}