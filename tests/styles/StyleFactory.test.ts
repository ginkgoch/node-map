import { StyleFactory } from "..";

describe('StyleFactory', () => {
    it('deserialize point style', () => {
        const json = {
            type: 'point-style',
            name: 'Point Style',
            maximumScale: Infinity,
            minimumScale: 0,
            symbol: 'rect',
            fillStyle: 'green',
            strokeStyle: 'yellow',
            lineWidth: 6,
            radius: 20
        };

        testStyleDeserialization(json);
    });

    it('deserialize line style', () => {
        const json = {
            type: 'line-style',
            name: 'Line Style',
            maximumScale: Infinity,
            minimumScale: 0,
            strokeStyle: '#00ff00',
            lineWidth: 6
        };

        testStyleDeserialization(json);
    });

    it('deserialize fill style', () => {
        const json = JSON.parse(`{"type":"fill-style","name":"Fill Style","maximumScale":10000000000,"minimumScale":0,"lineWidth":4,"fillStyle":"#00ff00","strokeStyle":"red"}`);

        testStyleDeserialization(json);
    });

    it('deserialize text style', () => {
        const json = {
            type: 'text-style',
            name: 'Text Style',
            maximumScale: 1e10,
            minimumScale: 0,
            content: 'Hello World',
            textAlign: 'center',
            font: '12px ARIAL',
            lineWidth: 0,
            fillStyle: '#ff0000'
        };

        testStyleDeserialization(json);
    });

    it('deserialize value style', () => {
        const json = JSON.parse('{"type":"value-style","name":"Value Style","maximumScale":10000000000,"minimumScale":0,"items":[{"value":"1","style":{"type":"point-style","name":"1","maximumScale":10000000000,"minimumScale":0,"symbol":"default","fillStyle":"#ff0000","strokeStyle":"#000000","lineWidth":1,"radius":12}},{"value":"2","style":{"type":"point-style","name":"2","maximumScale":10000000000,"minimumScale":0,"symbol":"default","fillStyle":"#ff0000","strokeStyle":"#000000","lineWidth":1,"radius":12}},{"value":"3","style":{"type":"point-style","name":"3","maximumScale":10000000000,"minimumScale":0,"symbol":"default","fillStyle":"#aaff00","strokeStyle":"#000000","lineWidth":1,"radius":12}},{"value":"4","style":{"type":"point-style","name":"4","maximumScale":10000000000,"minimumScale":0,"symbol":"default","fillStyle":"#0000ff","strokeStyle":"#000000","lineWidth":1,"radius":12}}],"field":"type"}');

        testStyleDeserialization(json);
    });

    it('deserialize class break style', () => {
        const json = JSON.parse('{"type":"class-break-style","name":"ClassBreak Style","maximumScale":10000000000,"minimumScale":0,"field":"type","classBreaks":[{"minimum":0,"maximum":25,"style":{"type":"point-style","name":"0 ~ 25","maximumScale":10000000000,"minimumScale":0,"symbol":"default","fillStyle":"#ff0000","strokeStyle":"#ff0000","lineWidth":0,"radius":12}},{"minimum":25,"maximum":50,"style":{"type":"point-style","name":"25 ~ 50","maximumScale":10000000000,"minimumScale":0,"symbol":"default","fillStyle":"#ff0000","strokeStyle":"#ff0000","lineWidth":0,"radius":12}},{"minimum":50,"maximum":75,"style":{"type":"point-style","name":"50 ~ 75","maximumScale":10000000000,"minimumScale":0,"symbol":"default","fillStyle":"#aaff00","strokeStyle":"#aaff00","lineWidth":0,"radius":12}},{"minimum":75,"maximum":10000000000,"style":{"type":"point-style","name":"75 ~ 10000000000","maximumScale":10000000000,"minimumScale":0,"symbol":"default","fillStyle":"#0000ff","strokeStyle":"#0000ff","lineWidth":0,"radius":12}}]}');

        testStyleDeserialization(json);
    });
});

function testStyleDeserialization(json: any) {
    const sf = StyleFactory as any;
    const style = sf._deserialize(json);

    const newJson = style.json();
    expect(newJson).toEqual(json);
}