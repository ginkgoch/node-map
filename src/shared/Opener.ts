export abstract class Opener {
    opened: boolean = false;

    async open() {
        if (!this.opened) {
            await this._open();
            this.opened = true;
        }
    }

    protected abstract async _open(): Promise<void>;

    async close() {
        if (this.opened) {
            await this._close();
            this.opened = false;
        }
    }

    protected abstract async _close(): Promise<void>;

    protected get _openRequired() {
        return true;
    }
}

export default class OpenerSync {
    isOpened : boolean;

    constructor() {
        this.isOpened = false;
    }

    open() {
        if (this.isOpened) return this;

        this.isOpened = true;
        this._open();
        return this;
    }

    protected _open() { }

    close() {
        if(this.isOpened) {
            this._close();
            this.isOpened = false;
        }
    }

    protected _close() { }

    openWith(action: () => void) {
        try {
            this.open();
            action();
        } finally {
            this.close();
        }
    }
}