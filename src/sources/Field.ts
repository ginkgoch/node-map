export class Field {
    name: string;
    type: string;
    length: number;

    constructor(name: string, type: string, length: number) {
        this.name = name;
        this.type = type;
        this.length = length;
    }
}