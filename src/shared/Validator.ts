import { Opener } from "../sources/Opener";
import { FeatureSource } from "../sources/FeatureSource";

export default class Validator {
    static checkOpenAndEditable(source: FeatureSource, ignoreOpen = false) {
        Validator.checkEditable(source);
        Validator.checkOpened(source, ignoreOpen);        
    }

    static checkEditable(source: FeatureSource) {
        if (!source.editable()) throw new Error('Source is not editable.');
    }

    static checkOpened(opener: Opener, ignore: boolean = false) {
        if (!ignore && !opener.opened) throw new Error('Resource is not opened. Call open() method.')
    }
}