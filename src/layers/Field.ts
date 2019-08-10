export class Field {
    name: string;
    type: string;
    length: number;
    extra: Map<string, any>;

    constructor(name: string, type: string, length: number, extra?: any) {
        this.name = name;
        this.type = type;
        this.length = length;
        this.extra = new Map();

        if (extra instanceof Map) {
            extra.forEach((v, k) => {
                this.extra.set(k, v);
            });
        } else if (extra !== undefined) {
            Object.keys(extra).forEach(k => {
                this.extra.set(k, extra[k]);
            });
        }
    }
}