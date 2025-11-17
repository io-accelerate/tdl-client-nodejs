export default class TestAuditStream {
    constructor() {
        this._log = '';
    }

    getLog() {
        return this._log;
    }

    log(value) {
        this._log += value + '\n';
    }
}
