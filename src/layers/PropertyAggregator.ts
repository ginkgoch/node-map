import _ from "lodash";
import { Constants } from "../shared";

/**
 * This class represents a utility for aggregating property data from a feature source.
 * @category source shared
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
    select(field: string, sort: boolean = false, sortFn?: (a:any, b:any)=>number) {
        let result = _.chain(this.properties).filter(p => p.has(field)).map(p => p.get(field)).value();
        if (sort) {
            result = result.sort(sortFn);
        }

        return result;
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

    breakDownValues(field: string, breakCount: number, breakBy?: 'value' | 'position'): Array<{minimum:number, maximum:number}> {
        let result = new Array<{minimum:number, maximum:number}>();
        switch(breakBy) {
            case 'position': 
                result.push(...this._breakDownByPosition(field, breakCount));
                break;
            default:
                result.push(...this._breakDownByValues(field, breakCount));
                break;
        }

        return result;
    }

    private _breakDownByPosition(field: string, breakCount: number) {
        let result = new Array<{minimum:number, maximum:number}>();
        
        let fieldValues = this.select(field, true, (a, b) => +a - +b);
        let fieldValuesCount = fieldValues.length;
        if (breakCount > fieldValuesCount) {
            breakCount = fieldValuesCount;
        }
        
        let increment = Math.floor(fieldValuesCount / breakCount);
        
        for (let i = 0; i < breakCount; i++) {
            let current = i * increment;
            let posMin = current;
            let posMax = current + increment;
            let minimum = fieldValues[posMin];
            let maximum = fieldValues[posMax];
            if (i === breakCount - 1) {
                posMax = fieldValuesCount - 1;
                maximum = Constants.POSITIVE_INFINITY_SCALE;
            }

            result.push({minimum, maximum});
        }

        return result;
    }

    private _breakDownByValues(field: string, breakCount: number) {
        let result = new Array<{minimum:number, maximum:number}>();
        
        let { minimum, maximum } = this.general(field);
        let increment = Math.abs(maximum! - minimum!) / breakCount;
        for (let i = 0; i < breakCount; i++) {
            let breakMin = minimum! + i * increment;
            let breakMax = breakMin + increment;
            if (minimum! > 0 && i === 0) {
                breakMin = 0;
            }

            if (i === breakCount - 1) {
                breakMax = Constants.POSITIVE_INFINITY_SCALE;
            }

            result.push({ minimum: breakMin, maximum: breakMax });
        }

        return result;
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