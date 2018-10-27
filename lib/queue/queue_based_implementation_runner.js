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
  // TODO: clientaction is removed and the Java implementation looks like this https://github.com/julianghionoiu/tdl-client-java/commit/4475fc3b01bb3f6fbc2b2d423848f5dcec489461#diff-4c5725a54acaaa62088fef7037e46c0eR104
  if (response instanceof FatalErrorResponse) {
      audit.endLine();
      return [];
  }

  return Promise.resolve(remoteBroker).then(function(remoteBroker) {
    audit.endLine();
    return remoteBroker.respondTo(request, response);
  });
};

module.exports = QueueBasedImplementationRunner;
