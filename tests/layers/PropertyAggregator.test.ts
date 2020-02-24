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

    it('break down - values', async () => {
        await aggregate(filePath, 'HOUSEHOLDS', agg => {
            const result = agg.breakDownValues('HOUSEHOLDS', 10);
            expect(result.length).toBe(10);

            let expected = [{"minimum":0,"maximum":1190075.7},{"minimum":1190075.7,"maximum":2211312.4},{"minimum":2211312.4,"maximum":3232549.0999999996},{"minimum":3232549.0999999996,"maximum":4253785.8},{"minimum":4253785.8,"maximum":5275022.5},{"minimum":5275022.5,"maximum":6296259.2},{"minimum":6296259.199999999,"maximum":7317495.899999999},{"minimum":7317495.899999999,"maximum":8338732.6},{"minimum":8338732.6,"maximum":9359969.299999999},{"minimum":9359969.299999999,"maximum":10000000000}];
            expect(result).toEqual(expected);
        });
    });

    it('break down - position', async () => {
        await aggregate(filePath, 'HOUSEHOLDS', agg => {
            const result = agg.breakDownValues('HOUSEHOLDS', 10, 'position');
            expect(result.length).toBe(10);

            let expected = [{"minimum":168839,"maximum":249634},{"minimum":249634,"maximum":377977},{"minimum":377977,"maximum":542709},{"minimum":542709,"maximum":944726},{"minimum":944726,"maximum":1258044},{"minimum":1258044,"maximum":1506790},{"minimum":1506790,"maximum":1872431},{"minimum":1872431,"maximum":2366615},{"minimum":2366615,"maximum":4202240},{"minimum":4202240,"maximum":1e10}];
            expect(result).toEqual(expected);
        });
    });

    it('break down - position - edge case', async () => {
        await aggregate(filePath, 'HOUSEHOLDS', agg => {
            const result = agg.breakDownValues('HOUSEHOLDS', 100, 'position');
            expect(result.length).toBe(51);
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