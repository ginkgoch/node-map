import fs from "fs";
import { Image } from '..';

export default class TestUtils {
    static resolveDataPath(root: string, path: string) {
        return root + path;
    }

    static resolveStyleDataPath(path: string) {
        return TestUtils.resolveDataPath('./tests/data/styles/', path);
    }

    static compareImageFunc(resolvePath: (name: string) => string) {
        let res = resolvePath;
        return function (image: Image, name: string, gen: boolean = false) {
            const filePath = res(name);
    
            if (gen) {
                fs.writeFileSync(res(name), image.buffer);
            } else {
                const expectBuff = fs.readFileSync(filePath);
                expect(image.buffer).not.toBeNull();
                expect(Buffer.compare(<Buffer>image.buffer, expectBuff)).toBe(0);
            }
        }
    }

    static compareOrLog(actual: any, expected: any, stringlify = false, log = false) {
        if (stringlify) {
            actual = JSON.stringify(actual);
        }
        if (log) {
            console.log(actual);
        } else {
            expect(actual).toEqual(expected);
        }
    } 
}