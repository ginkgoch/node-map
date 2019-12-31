/**
 * This is an in-memory tile cache that automatically retires oldest cache when exceeds its capacity.
 * This is a generic class that developers can defines a custom tile class to maintain any info.
 */
export class TileCache<T> {
    _cacheIndex: Array<string>;
    _cache: Map<string, T>;

    /**
     * Constructs a tile cache instance.
     * @param {number} capacity Indicates the tile cache count capacity of this cache. 
     * When a new tile is cached, and exceeds this number, the oldest tile will be retired to maintain a healthy cache amount.
     */
    constructor(public capacity = 128) {
        if (capacity < 0) {
            throw new Error('Cache capacity must be a positive number.');
        }

        this.capacity = capacity;
        this._cacheIndex =  new Array<string>();
        this._cache = new Map<string, T>();
    }

    /**
     * PUsh a new tile into the cache.
     * @param {string} id The tile id to cache. 
     * @param {T} content The concrete tile object.
     */
    push(id: string, content: T) {
        if (this.capacity === 0) return;

        if (this._cache.has(id)) {
            this._cache.set(id, content);
        }
        else {
            this._cache.set(id, content);
            this._cacheIndex.push(id);
        }

        const leakCount =  this._cacheIndex.length -  this.capacity;
        if (leakCount > 0) {
            const expiredItems = this._cacheIndex.splice(0, leakCount);
            for (let i = 0; i < expiredItems.length; i++) {
                this._cache.delete(expiredItems[i]);
            }
        }
    }

    /**
     * Gets a tile by id.
     * @param {string} id The id of tile to find.
     * @returns {T} The tile with the specified id. If it is not found, returns `undefined`.
     */
    get(id: string): T | undefined {
        if (this._cache.has(id)) {
            return this._cache.get(id);
        }

        return undefined;
    }

    /**
     * Clears all the tile caches.
     */
    clear() {
        this._cache.clear();
        this._cacheIndex.length = 0;
    }

    /**
     * Gets the count of the reserving cached tiles.
     * @returns {number} The count of cached tiles.
     */
    count(): number  {
        return this._cacheIndex.length;
    }
}