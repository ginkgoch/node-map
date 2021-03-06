import fs from 'fs';
import { FileStream } from "ginkgoch-filestream";
import { RTConstants } from './RTUtils';

const HEADER_LENGTH = 32;
const RECORD_LENGTH = 16;

/** @ignore */
export class RTIdsHeader {
    nextValidBlock = 0;

    public read(stream: FileStream) {
        const buff = stream.read(4);
        this.nextValidBlock = buff.readInt32LE(0);

        stream.seek(HEADER_LENGTH - 4, 'current');
    }

    public write(stream: FileStream) {
        let buff = Buffer.alloc(4);
        buff.writeInt32LE(this.nextValidBlock, 0);
        stream.write(buff);

        buff = Buffer.alloc(HEADER_LENGTH - 4);
        stream.write(buff);

        stream.invalidCache();
    }
}

/** @ignore */
export class RTIdsRecord {
    id: string = '';
    length: number = 0;

    write(stream: FileStream) {
        let buff = Buffer.alloc(4);
        buff.writeInt32LE(this.length, 0);
        stream.write(buff);

        buff = Buffer.from(this.id, RTConstants.DEFAULT_ENCODING);
        stream.write(buff);

        const tmp = (this.length + 4) % RECORD_LENGTH;
        if (tmp !== 0) {
            buff = Buffer.alloc(RECORD_LENGTH - tmp);
            stream.write(buff);
        }

        stream.invalidCache();
    }
}

/** @ignore */
export class RTIds {
    filePath?: string;
    flag: string = 'rs';

    record = new RTIdsRecord();
    header = new RTIdsHeader();

    private _fd?: number;
    private _stream?: FileStream;

    open(filePath?: string, flag?: string) {
        this.filePath = filePath || this.filePath;
        this.flag = flag || this.flag;

        this._fd = fs.openSync(this.filePath!, this.flag);
        this._stream = new FileStream(this._fd);
    }

    close() {
        if (this._stream !== undefined) {
            this._stream!.close();
        }
        if (this._fd !== undefined) {
            fs.closeSync(this._fd);
            this._fd = undefined;
        }
    }

    id(block: number): string {
        const recPos = HEADER_LENGTH + RECORD_LENGTH * block;
        this._stream!.seek(recPos);
        const length = this._stream!.read(4).readInt32LE(0);
        const id = this._stream!.read(length).toString(RTConstants.DEFAULT_ENCODING);
        return id;
    }

    write(id: string) {
        this._stream!.seek(0);
        this.header.read(this._stream!);

        const block = this.header.nextValidBlock;
        this._stream!.seek(block * RECORD_LENGTH + HEADER_LENGTH);
        this.record.id = id;
        this.record.length = Buffer.from(id, RTConstants.DEFAULT_ENCODING).length;
        this.record.write(this._stream!);

        this._stream!.seek(0);
        this.header.nextValidBlock += Math.floor((this.record.length + 3) / RECORD_LENGTH) + 1;
        this.header.write(this._stream!);

        return block;
    }

    static createEmpty(filePath: string) {
        const fd = fs.openSync(filePath, 'w+');
        const stream = new FileStream(fd);

        try {
            const header = new RTIdsHeader();
            header.nextValidBlock = 0;
            header.write(stream);
        }
        finally {
            stream.close();
            fs.closeSync(fd);
        }
    }
}