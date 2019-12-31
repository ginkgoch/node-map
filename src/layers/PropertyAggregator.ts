import _ from "lodash";

/**
 * This class represents a utility for aggregating property data from a feature source.
 */
export class PropertyAggregator {
    /**
     * The properties for aggregating.
     */
    properties: Array<Map<string, any>>

    /**
     * Constructs an aggregator instance.
     * @param {Array<Map<string, any>>} properties The properties for aggregating.
     */
    constructor(properties: Array<Map<string, any>>) {
        this.properties = properties;
    }

    /**
     * Selects values by a specific field name.
     * @param {string} field The field name to filter from the source property data. 
     * @returns {any[]} An array of field values of the specified field name.
     */
    select(field: string) {
        return _.chain(this.properties).filter(p => p.has(field)).map(p => p.get(field)).value();
    }

    /**
     * Select values by a specific field name and get rid of the duplicated values.
     * @param {string} field The field name to filter from the source property data.  
     * @param {boolean} sort Whether the return values need to be sorted.
     * @returns {any[]} An array of distinct field values of the specified field name.
     */
    distinct(field: string, sort = false) {
        let query = _.chain(this.properties).filter(p => p.has(field)).map(p => p.get(field));
        if (sort) {
            query = query.sortedUniq().orderBy(v => v, 'asc');
        } else {
            query = query.uniq();
        }

        return query.value();
    }

    /**
     * Gets some general aggregated result from a specific field name.
     * @param {string} field The field name to calculate the general aggregated result.  
     * @returns {AggregationResult} The general aggregation result.
     */
    general(field: string): AggregationResult {
        let fieldValues = this.select(field);
        let result = { count: fieldValues.length } as AggregationResult;

        let sum = 0;
        for (let v of fieldValues) {
            if (typeof v === 'number') {
                sum += v;

                let maximum = _.defaultTo(result.maximum, v);
                result.maximum = Math.max(maximum, v);

                let minimum = _.defaultTo(result.minimum, v);
                result.minimum = Math.min(minimum, v);
            } 
        }

        result.sum = sum;
        if (result.count !== 0) {
            result.average = result.sum / result.count;
        }

        return result;
    }
}

/**
 * This interface defines the schema of the general aggregation result.
 */
export interface AggregationResult {
    /**
     * The count of the items.
     */
    count: number;
    /**
     * The maximum value in the items.
     */
    maximum?: number; 
    /**
     * The minimum value in the items.
     */
    minimum?: number; 
    /**
     * The average value in the items.
     */
    average?: number;
    /**
     * The sum of the item values.
     */
    sum?: number;
}