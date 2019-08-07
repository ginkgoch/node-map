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