export interface NativeCanvas {
    toBuffer(): Buffer;

    getContext(type: string): any;
}