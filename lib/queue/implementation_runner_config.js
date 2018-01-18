'use struct';

var ConsoleAuditStream = require('../audit/console_audit_stream');

function ImplementationRunnerConfig() {
    this._hostname = 61616;
    this._requestTimeoutMillis = 500;
    this._auditStream = new ConsoleAuditStream();
}

ImplementationRunnerConfig.prototype.setHostname = function(hostname) {
    this._hostname = hostname;
    return this;
}

ImplementationRunnerConfig.prototype.setPort = function(port) {
    this._port = port;
    return this;
}

ImplementationRunnerConfig.prototype.setUniqueId = function(uniqueId) {
    this._uniqueId = uniqueId;
    return this;
}

ImplementationRunnerConfig.prototype.setTimeToWaitForRequest = function(timeToWaitForRequest) {
    this._requestTimeoutMillis = timeToWaitForRequest;
    return this;
}

ImplementationRunnerConfig.prototype.setAuditStream = function(auditStream) {
    this._auditStream = auditStream;
    return this;
}

ImplementationRunnerConfig.prototype.getHostName = function() {
    return this._hostname;
}

ImplementationRunnerConfig.prototype.getPort = function() {
    return this._port;
}

ImplementationRunnerConfig.prototype.getUniqueId = function() {
    return this._uniqueId;
}

ImplementationRunnerConfig.prototype.getTimeToWaitForRequest = function() {
    return this._requestTimeoutMillis;
}

ImplementationRunnerConfig.prototype.getAuditStream = function() {
    return this._auditStream;
}

module.exports = ImplementationRunnerConfig;
