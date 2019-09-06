import { TileCache } from "../../src/map";

describe('TileCache', () => {
    it('cache crud', () => {
        const cache = new TileCache<string>(4);

        cache.push('1', '1');
        cache.push('2', '2');
        cache.push('3', '3');
        cache.push('1', '4');

        expect(cache.count()).toBe(3);
        expect(cache._cacheIndex).toEqual(['1', '2', '3']);

        cache.push('4', '4');
        expect(cache.count()).toBe(4);
        expect(cache._cacheIndex).toEqual(['1', '2', '3', '4']);

        cache.push('5', '5');
        cache.push('6', '6');
        expect(cache.count()).toBe(4);
        expect(cache._cacheIndex).toEqual(['3', '4', '5', '6']);

        expect(cache.get('6')).toBe('6');
        expect(cache.get('1')).toBeUndefined();

        cache.clear();
        expect(cache.count()).toBe(0);
    });
});