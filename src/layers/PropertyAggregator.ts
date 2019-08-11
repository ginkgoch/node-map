import _ from "lodash";

export class PropertyAggregator {
    properties: Array<Map<string, any>>

    constructor(properties: Array<Map<string, any>>) {
        this.properties = properties;
    }

    select(field: string) {
        return _.chain(this.properties).filter(p => p.has(field)).map(p => p.get(field)).value();
    }

    distinct(field: string, sort = false) {
        let query = _.chain(this.properties).filter(p => p.has(field)).map(p => p.get(field));
        if (sort) {
            query = query.sortedUniq().orderBy(v => v, 'asc');
        } else {
            query = query.uniq();
        }

        return query.value();
    }

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

export interface AggregationResult {
    count: number;
    maximum?: number; 
    minimum?: number; 
    average?: number;
    sum?: number;
}