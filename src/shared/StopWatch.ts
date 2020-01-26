export class StopWatch {
    timestamp: number;
    elapsed: number;

    constructor() {
        this.timestamp = 0;
        this.elapsed = 0;
    }

    start() {
        this.timestamp = +new Date(); 
    }

    stop() {
        this.elapsed += +new Date() - this.timestamp;
    }

    restart() {
        this.elapsed = 0;
        this.start();
    }

    log(event?: string) {
        console.log(`${event || 'It'} took ${this.elapsed} ms.`);
    }

    static startNew(): StopWatch {
        const sw = new StopWatch();
        sw.start();
        return sw;
    }
}