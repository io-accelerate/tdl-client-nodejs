'use strict';

//https://github.com/gdaws/node-stomp
var RemoteBroker = require('./transport/remote_broker');

function Client(opts){
    this.hostname = opts.hostname;
    this.port = opts.port || 61613;
    this.uniqueId = opts.uniqueId;
}

Client.prototype.goLiveWith = function (processingRules) {
    return new RemoteBroker(this.uniqueId).connect(this.hostname, this.port)
        .then(function (remoteBroker) {
            return remoteBroker.subscribe(processingRules);
        })
        .then(function (remoteBroker) {
            return remoteBroker.close()
        });
};

module.exports = Client;