import { StyleFactory, Constants } from "..";

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
            maximumScale: Constants.POSITIVE_INFINITY_SCALE,
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
    
    it('deserialize icon style', () => {
        const json = JSON.parse('{"type":"icon-style","name":"Icon Style","maximumScale":10000000000,"minimumScale":0,"icon":{"type":"image","width":32,"height":32,"buffer":{"type":"Buffer","data":[137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,0,32,0,0,0,32,8,6,0,0,0,115,122,122,244,0,0,0,4,115,66,73,84,8,8,8,8,124,8,100,136,0,0,0,9,112,72,89,115,0,0,11,19,0,0,11,19,1,0,154,156,24,0,0,2,40,73,68,65,84,88,133,189,150,203,74,28,65,20,134,191,54,70,179,14,145,236,162,14,104,140,34,121,2,17,23,138,184,8,100,23,18,220,40,232,120,91,9,74,242,4,174,124,10,97,136,130,78,130,8,146,219,34,235,36,146,133,144,157,168,120,65,240,54,234,168,48,154,69,117,75,123,170,102,186,170,167,245,135,179,168,174,62,231,251,187,250,84,117,123,184,41,5,188,1,58,128,22,224,137,127,125,15,88,5,190,3,25,96,205,177,110,164,234,129,57,160,0,92,71,68,1,248,8,212,38,5,239,5,78,45,192,50,78,128,119,229,194,39,99,128,101,140,199,133,247,22,41,248,27,24,4,26,128,42,63,26,129,52,176,82,36,231,173,43,188,30,125,217,207,128,254,136,60,207,55,151,23,185,57,224,153,139,129,89,3,188,205,33,191,221,96,34,99,155,156,66,239,246,168,39,55,41,45,106,20,176,220,25,31,208,223,185,84,19,144,5,142,81,221,254,217,191,22,150,135,222,19,147,54,6,190,136,164,65,3,252,16,189,209,14,13,38,134,197,61,203,54,6,182,68,82,131,152,207,26,224,65,124,50,152,13,207,111,216,24,184,20,73,85,98,254,184,132,129,156,184,183,90,204,95,72,88,133,193,192,149,141,203,152,210,106,155,12,236,137,113,157,24,127,43,1,248,42,198,41,49,222,45,145,123,163,37,110,47,91,90,204,63,7,14,208,151,127,31,117,34,134,53,42,238,89,180,49,240,94,36,173,160,182,84,88,141,192,60,170,31,114,192,130,1,238,1,127,69,173,9,27,3,173,232,79,39,183,162,141,70,12,117,154,109,147,255,136,196,60,234,120,181,85,7,112,46,106,252,114,200,103,0,221,125,30,181,18,242,117,132,229,161,158,92,194,175,129,62,23,3,143,128,109,67,145,160,39,134,81,135,76,181,31,47,80,13,39,223,121,16,155,232,231,73,164,198,138,20,139,19,67,174,112,128,135,192,191,4,224,171,64,101,28,3,0,221,9,24,232,140,11,15,148,41,3,62,83,46,28,212,191,255,78,12,248,22,240,56,9,3,0,61,142,240,43,160,43,41,120,160,105,7,3,83,73,195,65,237,138,159,22,240,31,192,131,187,48,0,240,20,88,47,1,95,3,106,238,10,30,232,37,234,11,40,225,71,168,15,217,189,168,139,219,191,110,151,36,176,223,93,245,26,181,61,183,129,87,113,139,252,7,190,113,106,90,186,163,83,154,0,0,0,0,73,69,78,68,174,66,96,130]}},"offsetX":0,"offsetY":0}');

        testStyleDeserialization(json);
    });
});

function testStyleDeserialization(json: any) {
    const sf = StyleFactory;
    const style = sf.parseJSON(json);

    const newJson = style.toJSON();
    expect(newJson).toEqual(json);
}