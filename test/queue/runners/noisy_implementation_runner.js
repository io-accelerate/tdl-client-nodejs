export default class NoisyImplementationRunner {
    constructor(deployMessage) {
        this._deployMessage = deployMessage;
    }

    run() {
        return new Promise((resolve) => {
            this._auditStream.log(this._deployMessage);
            resolve();
        });
    }

    setAuditStream(auditStream) {
        this._auditStream = auditStream;
    }
}
