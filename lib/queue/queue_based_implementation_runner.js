"use strict";

var AuditStream = require("../audit/audit_stream");
var RemoteBroker = require("./transport/remote_broker");

function QueueBasedImplementationRunner(config, deployProcessingRules) {
  this._config = config;
  this._deployProcessingRules = deployProcessingRules;
}

QueueBasedImplementationRunner.prototype.getRequestTimeoutMillisecond = function() {
  return this._config.getTimeToWaitForRequest();
};

QueueBasedImplementationRunner.prototype.run = function() {
  let config = this._config;
  let processingRules = this._deployProcessingRules;

  return new RemoteBroker()
    .connect(
      config.getHostName(),
      config.getPort(),
      config.getRequestQueueName(),
      config.getResponseQueueName()
    )
    .then(function(remoteBroker) {
      console.log("Starting client.");
      return remoteBroker.subscribeAndProcess(
        new ApplyProcessingRules(processingRules),
        config.getTimeToWaitForRequest()
      );
    })
    .then(function(remoteBroker) {
      console.log("Stopping client.");
      return remoteBroker.close();
    })
    .catch(function(error) {
      console.error(
        "There was a problem processing messages. " + error.message
      );
      console.error(error.stack);
    });
};

//~~~~ Queue handling policies

function ApplyProcessingRules(processingRules) {
  this.processingRules = processingRules;
  this.audit = new AuditStream();
}

ApplyProcessingRules.prototype.processNextRequestFrom = function(
  remoteBroker,
  request
) {
  var audit = this.audit;
  audit.startLine();
  audit.log(request);

  // Obtain response from user
  var response = this.processingRules.getResponseFor(request);
  audit.log(response);

  // Act
  // TODO: replace this bit with something so it does not fail, clientAction is not assigned (null)
  return Promise.resolve(remoteBroker).then(function(remoteBroker) {
    audit.endLine();
    return remoteBroker.respondTo(request, response);
  });
};

module.exports = QueueBasedImplementationRunner;
