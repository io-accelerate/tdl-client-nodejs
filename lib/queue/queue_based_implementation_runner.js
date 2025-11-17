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
    var handlingRules = this.processingRules;
    var self = this;

    audit.startLine();
    audit.log_request(request);

    return Promise.resolve()
        .then(function () {
            return handlingRules.getResponseFor(request);
        })
        .then(function (response) {
            return self._resolveResponse(response);
        })
        .then(function (response) {
            audit.log_response(response);
            return self._sendResponse(remoteBroker, request, response, audit);
        });
};

ApplyProcessingRules.prototype._resolveResponse = function (response) {
    if (!response || response instanceof FatalErrorResponse) {
        return Promise.resolve(response);
    }

    if (this._isThenable(response.result)) {
        return Promise.resolve(response.result)
            .then(function (value) {
                response.result = value;
                return response;
            })
            .catch(function (error) {
                var message = '"user implementation raised exception"';
                var errorMessage = error && error.message ? error.message : error;
                console.warn(message + ", " + errorMessage);
                if (error && error.stack) {
                    console.warn(error.stack);
                }
                return new FatalErrorResponse(message);
            });
    }

    return Promise.resolve(response);
};

ApplyProcessingRules.prototype._sendResponse = function (
    remoteBroker,
    request,
    response,
    audit
) {
    return Promise.resolve(remoteBroker).then(function (remoteBroker) {
        if (response instanceof FatalErrorResponse) {
            audit.endLine();
            return remoteBroker.close();
        }

        return remoteBroker
            .respondTo(request, response)
            .then(function (remoteBroker) {
                audit.endLine();
                return remoteBroker;
            });
    });
};

ApplyProcessingRules.prototype._isThenable = function (value) {
    return value && typeof value.then === 'function';
};

export default QueueBasedImplementationRunner;
