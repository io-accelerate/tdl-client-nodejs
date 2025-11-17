export default class QuietImplementationRunner {
    run() {
        return new Promise((resolve) => {
            resolve();
        });
    }

    setAuditStream() {
        // Intentionally left blank
    }
}
