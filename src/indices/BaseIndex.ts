import assert from 'assert';
import { IEnvelope } from "ginkgoch-geom";

const INDEX_NOT_OPENED = 'Index is not opened.';

export abstract class BaseIndex {
    opened = false;

    count(): number {
        assert(this.opened, INDEX_NOT_OPENED);

        return this._count();
    }

    protected abstract _count(): number;

    open(option?: string) { 
        this.opened = true;
    }

    close() { 
        this.opened = false;
    }

    intersections(rect: IEnvelope): string[] {
        return this.insiders(rect);
    }

    insiders(rect: IEnvelope): string[] {
        assert(this.opened, INDEX_NOT_OPENED);

        return this._insiders(rect);
    }

    protected abstract _insiders(rect: IEnvelope): string[];
}
