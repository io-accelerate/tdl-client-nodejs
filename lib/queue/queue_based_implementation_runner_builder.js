import QueueBasedImplementationRunner from './queue_based_implementation_runner.js';
import ProcessingRules from './processing_rules.js';

function QueueBasedImplementationRunnerBuilder() {
  this._deployProcessingRules = new ProcessingRules();

  this._deployProcessingRules
    .on("display_description")
    .call(function() {
      return "OK";
    })
    .build();
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
    .build();
  return this;
};

QueueBasedImplementationRunnerBuilder.prototype.create = function() {
  return new QueueBasedImplementationRunner(
    this._config,
    this._deployProcessingRules
  );
};

export default QueueBasedImplementationRunnerBuilder;
