import fs from 'fs';
import assert from 'assert';
import { Opener } from "./Opener";
import { FeatureSource } from "../layers/FeatureSource";
import { Srs } from '..';
import { Unit } from './Unit';

export class Validator {
    static checkOpenAndEditable(source: FeatureSource, ignoreOpen = false) {
        Validator.checkEditable(source);
        Validator.checkOpened(source, ignoreOpen);        
    }

    static checkEditable(source: FeatureSource) {
        if (!source.editable) throw new Error('Source is not editable.');
    }

    static checkOpened(opener: Opener, ignore: boolean = false) {
        if (!ignore && !opener.opened) throw new Error('Resource is not opened. Call open() method.')
    }

    static checkAllOpened(openers: Array<Opener>, ignore: boolean = false) {
        openers.forEach(o => this.checkOpened(o, ignore));
    }

    static checkFilePathNotEmptyAndExist(filePath: string) {
        assert(filePath !== '', 'File path cannot be empty.');
        assert(fs.existsSync(filePath), `File ${ filePath } doesn't exist.`);
    }

    static checkSrsIsValid(srs: Srs) {
        if (srs === undefined || srs.unit === Unit.unknown) {
            throw new Error(`SRS (${ srs.projection }) is not recognized.`);
        }
    }
}