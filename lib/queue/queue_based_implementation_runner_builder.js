'use strict';

var QueueBasedImplementationRunner = require('./queue_based_implementation_runner');
var ProcessingRules = require('./processing_rules');
var PublishAction = require('./actions/publish_action');

function QueueBasedImplementationRunnerBuilder() {
    this._deployProcessingRules = new ProcessingRules();

    this._deployProcessingRules
        .on('display_description')
        .call(function() { return 'OK'; })
        .then(new PublishAction());
}

QueueBasedImplementationRunnerBuilder.prototype.setConfig = function(config) {
    this._config = config;
    return this;
}

QueueBasedImplementationRunnerBuilder.prototype.withSolutionFor = function(methodName, userImplementation, action) {
    this._deployProcessingRules
        .on(methodName)
        .call(userImplementation)
        .then(action || new PublishAction());
    return this;
}

QueueBasedImplementationRunnerBuilder.prototype.create = function() {
    return new QueueBasedImplementationRunner(this._config, this._deployProcessingRules);
}

module.exports = QueueBasedImplementationRunnerBuilder;
