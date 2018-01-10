'use strict';

var QueueBasedImplementationRunner = require('./queue_based_implementation_runner');
var ProcessingRules = require('./processing_rules');
var PublishAction = require('./actions/publish_action');

class QueueBasedImplementationRunnerBuilder {
    constructor() {
        this._deployProcessingRules = new ProcessingRules();

        this._deployProcessingRules
            .on('display_description')
            .call(() => 'OK')
            .then(new PublishAction());
    }

    setConfig(config) {
        this._config = config;
        return this;
    }

    withSolutionFor(methodName, userImplementation, action) {
        this._deployProcessingRules
            .on(methodName)
            .call(userImplementation)
            .then(action || new PublishAction());
        return this;
    }

    create() {
        return new QueueBasedImplementationRunner(this._config, this._deployProcessingRules);
    }
}

module.exports = QueueBasedImplementationRunnerBuilder;
