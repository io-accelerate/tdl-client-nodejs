'use strict';

var ImplementationRunnerConfig = require('./implementation_runner_config');
var AuditStream = require('../audit/audit_stream');
var RemoteBroker = require('./transport/remote_broker');

class QueueBasedImplementationRunner {
    constructor(config, deployProcessingRules) {
        this._config = config;
        this._deployProcessingRules = deployProcessingRules;
        this._audit = new AuditStream();
    }

    getRequestTimeoutMillisecond() {
        return this._config.getTimeToWaitForRequest();
    }

    run() {
        let config = this._config;
        return new RemoteBroker(config.getUniqueId())
            .connect(config.getHostName(), config.getPort())
            .then(function (remoteBroker) {
                console.log("Starting client.");
                return remoteBroker.subscribeAndProcess(new ApplyProcessingRules(processingRules), client.requestTimeoutMillis);
            })
            .then(function (remoteBroker) {
                console.log("Stopping client.");
                return remoteBroker.close()
            })
            .catch(function (error) {
                console.error("There was a problem processing messages. " + error.message);
                console.error(error.stack)
            });
    }
}

module.exports = QueueBasedImplementationRunner;
