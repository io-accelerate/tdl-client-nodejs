'use strict';

var Promise = require('promise');

var RemoteBroker = require('./transport/remote_broker');

function Client(opts){
    this.hostname = opts.hostname;
    this.port = opts.port || 61613;
    this.uniqueId = opts.uniqueId;
}

Client.prototype.goLiveWith = function (processingRules) {
    return new RemoteBroker(this.uniqueId).connect(this.hostname, this.port)
        .then(function (remoteBroker) {
            console.log("Starting client.");
            return remoteBroker.subscribe(new ApplyProcessingRules(processingRules));
        })
        .then(function (remoteBroker) {
            console.log("Stopping client.");
            return remoteBroker.close()
        }).catch(function (error) {
            console.error("There was a problem processing messages. " + error.message);
            console.error(error.stack)
        });
};

//~~~~ Queue handling policies

function ApplyProcessingRules(processingRules) {
    this.processingRules = processingRules
}

ApplyProcessingRules.prototype.processNextRequestFrom = function (remoteBroker, request) {
    var response = this.processingRules.getResponseFor(request);
    var clientAction = response.clientAction;

    return Promise.resolve(remoteBroker)
        .then(function (remoteBroker) {
            return clientAction.afterResponse(remoteBroker, request, response)
        })
        .then(function (remoteBroker) {
            return clientAction.prepareForNextRequest(remoteBroker)
        });
};



module.exports = Client;