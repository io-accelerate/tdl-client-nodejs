'use struct';

var ConsoleAuditStream = require('../audit/console_audit_stream');

class ImplementationRunnerConfig {
    constructor () {
        this._hostname = 61616;
        this._requestTimeoutMillis = 500;
        this._auditStream = new ConsoleAuditStream();
    }

    setHostname(hostname) {
        this._hostname = hostname;
        return this;
    }

    setPort(port) {
        this._port = port;
        return this;
    }
    
    setUniqueId(uniqueId) {
        this._uniqueId = uniqueId;
        return this;
    }
    
    setTimeToWaitForRequest(timeToWaitForRequest) {
        this._requestTimeoutMillis = timeToWaitForRequest;
        return this;
    }
    
    setAuditStream(auditStream) {
        this._auditStream = auditStream;
        return this;
    }

    getHostName() {
        return this._hostname;
    }

    getPort() {
        return this._port;
    }

    getUniqueId() {
        return this._uniqueId;
    }

    getTimeToWaitForRequest() {
        return this._requestTimeoutMillis;
    }

    getAuditStream() {
        return this._auditStream;
    }
}

module.exports = ImplementationRunnerConfig;
