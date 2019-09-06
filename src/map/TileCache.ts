export class TileCache<T> {
    _cacheIndex: Array<string>;
    _cache: Map<string, T>;

    constructor(public capacity = 128) {
        if (capacity < 0) {
            throw new Error('Cache capacity must be a positive number.');
        }

        this.capacity = capacity;
        this._cacheIndex =  new Array<string>();
        this._cache = new Map<string, T>();
    }

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

    get(id: string): T | undefined {
        if (this._cache.has(id)) {
            return this._cache.get(id);
        }

        return undefined;
    }

    clear() {
        this._cache.clear();
        this._cacheIndex.length = 0;
    }

    count(): number  {
        return this._cacheIndex.length;
    }
}