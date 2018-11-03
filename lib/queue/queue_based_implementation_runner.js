"use strict";

var AuditStream = require("../audit/audit_stream");
var RemoteBroker = require("./transport/remote_broker");
var FatalErrorResponse = require("./abstractions/response/fatal_error_response");

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

  return new RemoteBroker(
    config.getRequestQueueName(),
    config.getResponseQueueName()
  )
    .connect(
      config.getHostName(),
      config.getPort()
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
  console.log("Response: " + JSON.stringify(response));
  return Promise.resolve(remoteBroker)
    .then(function(remoteBroker) {
      if (response instanceof FatalErrorResponse) {
        return Promise.resolve(remoteBroker);
      }
      return remoteBroker.respondTo(request, response);
    })
    .then(function(remoteBroker) {
      audit.endLine();
      if (response instanceof FatalErrorResponse) {
        return remoteBroker.close();
      }
      return Promise.resolve(remoteBroker);
    });
};

module.exports = QueueBasedImplementationRunner;
