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

    protected _checkOpened() {
        if (!this.opened) {
            throw new Error('Not opened. Call open() method and try again.');
        }
    }
}