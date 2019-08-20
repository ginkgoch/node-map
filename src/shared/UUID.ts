const ALPHABET = '23456789abdegjkmnpqrvwxyz';

export default function uuid(length = 8) {
    var rtn = '';
    for (var i = 0; i < length; i++) {
        rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    return rtn;
}