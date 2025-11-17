import AuditStream from '../audit/audit_stream.js';
import RemoteBroker from './transport/remote_broker.js';
import FatalErrorResponse from './abstractions/response/fatal_error_response.js';

function QueueBasedImplementationRunner(config, deployProcessingRules) {
    this._config = config;
    this._deployProcessingRules = deployProcessingRules;
}

QueueBasedImplementationRunner.prototype.getRequestTimeoutMillisecond = function () {
    return this._config.getTimeToWaitForRequest();
};

QueueBasedImplementationRunner.prototype.run = function () {
    var config = this._config;
    var processingRules = this._deployProcessingRules;
    var remoteBroker;
    
    return new RemoteBroker(
        config.getRequestQueueName(),
        config.getResponseQueueName()
    )
        .connect(
            config.getHostName(),
            config.getPort()
        )
        .then(function (rb) {
            remoteBroker = rb
            console.log("Starting client.");
            return remoteBroker.subscribeAndProcess(
                new ApplyProcessingRules(processingRules),
                config.getTimeToWaitForRequest()
            );
        })
        .catch(function (error) {
            console.error(
                "There was a problem processing messages. " + error.message
            );
            console.error(error.stack);
        })
        .finally(function () {
            if (remoteBroker) {
                console.log("Stopping client.");
                return remoteBroker.close();
            }
        });
};

//~~~~ Queue handling policies

function ApplyProcessingRules(processingRules) {
    this.processingRules = processingRules;
    this.audit = new AuditStream();
}

ApplyProcessingRules.prototype.processNextRequestFrom = function (
    remoteBroker,
    request
) {
    var audit = this.audit;
    audit.startLine();
    audit.log_request(request);

    // Obtain response from user
    var response = this.processingRules.getResponseFor(request);
    audit.log_response(response);

    // Act
    return Promise.resolve(remoteBroker)
        .then(function (remoteBroker) {
            if (response instanceof FatalErrorResponse) {
                return Promise.resolve(remoteBroker);
            }
            return remoteBroker.respondTo(request, response);
        })
        .then(function (remoteBroker) {
            audit.endLine();
            if (response instanceof FatalErrorResponse) {
                return remoteBroker.close();
            }
            return Promise.resolve(remoteBroker);
        });
};

export default QueueBasedImplementationRunner;
