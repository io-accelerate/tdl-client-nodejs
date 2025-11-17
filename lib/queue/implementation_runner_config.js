import ConsoleAuditStream from '../audit/console_audit_stream.js';

function ImplementationRunnerConfig() {
  this._port = 61613;
  this._requestTimeoutMillis = 500;
  this._auditStream = new ConsoleAuditStream();
  this._requestQueueName = "";
  this._responseQueueName = "";
}

ImplementationRunnerConfig.prototype.setHostname = function(hostname) {
  this._hostname = hostname;
  return this;
};

ImplementationRunnerConfig.prototype.setPort = function(port) {
  this._port = port;
  return this;
};

ImplementationRunnerConfig.prototype.setRequestQueueName = function(queueName) {
  this._requestQueueName = queueName;
  return this;
};

ImplementationRunnerConfig.prototype.setResponseQueueName = function(
  queueName
) {
  this._responseQueueName = queueName;
  return this;
};

ImplementationRunnerConfig.prototype.setTimeToWaitForRequest = function(
  timeToWaitForRequest
) {
  this._requestTimeoutMillis = timeToWaitForRequest;
  return this;
};

ImplementationRunnerConfig.prototype.setAuditStream = function(auditStream) {
  this._auditStream = auditStream;
  return this;
};

ImplementationRunnerConfig.prototype.getHostName = function() {
  return this._hostname;
};

ImplementationRunnerConfig.prototype.getPort = function() {
  return this._port;
};

ImplementationRunnerConfig.prototype.getRequestQueueName = function() {
  return this._requestQueueName;
};

ImplementationRunnerConfig.prototype.getResponseQueueName = function() {
  return this._responseQueueName;
};

ImplementationRunnerConfig.prototype.getTimeToWaitForRequest = function() {
  return this._requestTimeoutMillis;
};

ImplementationRunnerConfig.prototype.getAuditStream = function() {
  return this._auditStream;
};

export default ImplementationRunnerConfig;
