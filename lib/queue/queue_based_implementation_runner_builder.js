"use strict";

var QueueBasedImplementationRunner = require("./queue_based_implementation_runner");
var ProcessingRules = require("./processing_rules");

function QueueBasedImplementationRunnerBuilder() {
  this._deployProcessingRules = new ProcessingRules();

  this._deployProcessingRules
    .on("display_description")
    .call(function() {
      return "OK";
    })
    .then();
}

QueueBasedImplementationRunnerBuilder.prototype.setConfig = function(config) {
  this._config = config;
  return this;
};

QueueBasedImplementationRunnerBuilder.prototype.withSolutionFor = function(
  methodName,
  userImplementation
) {
  this._deployProcessingRules
    .on(methodName)
    .call(userImplementation)
    .then();
  return this;
};

QueueBasedImplementationRunnerBuilder.prototype.create = function() {
  return new QueueBasedImplementationRunner(
    this._config,
    this._deployProcessingRules
  );
};

module.exports = QueueBasedImplementationRunnerBuilder;
