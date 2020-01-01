import assert from 'assert';
import { IEnvelope } from "ginkgoch-geom";

const INDEX_NOT_OPENED = 'Index is not opened.';

/**
 * This class represents the base class of spatial index that allows to efficiently read data source with pre-built index files.
 * e.g. R-Tree, Quad-Tree etc.
 * @class
 * @abstract
 * @see RTIndex for a concrete implementation.
 */
export abstract class BaseIndex {
    opened = false;

    /**
     * Gets the indexed record count.
     */
    count(): number {
        assert(this.opened, INDEX_NOT_OPENED);

        return this._count();
    }

    /**
     * The concrete function to get indexed record count for override.
     * @abstract
     */
    protected abstract _count(): number;

    /**
     * Opens the index.
     * @param {string} [option] The options to open the index.
     */
    open(option?: string) { 
        this.opened = true;
    }

    /**
     * Closes the index.
     */
    close() { 
        this.opened = false;
    }

    /**
     * Gets the record ids that are intersected with the rectangle from index.
     * @param {IEnvelope} rect The rectangle to query records.
     * @return {string[]} The record ids that intersects the given rectangle.
     */
    intersections(rect: IEnvelope): string[] {
        return this.insiders(rect);
    }

    /**
     * Gets the record ids that are inside the rectangle from index.
     * @param {IEnvelope} rect rect The rectangle to query records.
     * @return {string[]} The record ids that intersects the given rectangle.
     */
    insiders(rect: IEnvelope): string[] {
        assert(this.opened, INDEX_NOT_OPENED);

        return this._insiders(rect);
    }

    /**
     * @abstract 
     * The concrete abstract function to get the record ids that are inside the rectangle from index.
     * @param {IEnvelope} rect rect The rectangle to query records.
     * @return {string[]} The record ids that intersects the given rectangle.
     */
    protected abstract _insiders(rect: IEnvelope): string[];
}
