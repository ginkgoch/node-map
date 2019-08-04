import { TextStyle } from "../../src/styles/TextStyle";

describe('TextStyle', () => {
    it('_extractFields - 1', () => {
        let style: any;
        style = new TextStyle('abc');
        let fields = style._extractFields();
        expect(fields).toEqual([]);
    });

    it('_extractFields - 2', () => {
        let style: any;
        style = new TextStyle('[abc] + [def]');
        let fields = style._extractFields();
        expect(fields).toEqual(['abc', 'def']);
    });

    it('_formattedContent', () => {
        let style: any;
        style = new TextStyle('[abc] + [def]');
        const map = new Map<string, any>([['abc', 'Hello'], ['def', 'World']]);
        const result = style._formatContent(map);
        expect(result).toEqual('Hello + World');
    });
});