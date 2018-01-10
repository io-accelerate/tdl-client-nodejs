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
        let processingRules = this._deployProcessingRules;
        
        return new RemoteBroker(config.getUniqueId())
            .connect(config.getHostName(), config.getPort())
            .then(function (remoteBroker) {
                console.log("Starting client.");
                return remoteBroker.subscribeAndProcess(new ApplyProcessingRules(processingRules), config.getTimeToWaitForRequest());
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

//~~~~ Queue handling policies

function ApplyProcessingRules(processingRules) {
    this.processingRules = processingRules;
    this.audit = new AuditStream();
}

ApplyProcessingRules.prototype.processNextRequestFrom = function (remoteBroker, request) {
    var audit = this.audit;
    audit.startLine();
    audit.log(request);

    // Obtain response from user
    var response = this.processingRules.getResponseFor(request);
    audit.log(response);

    // Obtain action
    var clientAction = response.clientAction;
    audit.log(clientAction);

    // Act
    return Promise.resolve(remoteBroker)
        .then(function (remoteBroker) {
            return clientAction.afterResponse(remoteBroker, request, response)
        })
        .then(function (remoteBroker) {
            audit.endLine();
            return clientAction.prepareForNextRequest(remoteBroker)
        });
};

module.exports = QueueBasedImplementationRunner;
