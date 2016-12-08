'use strict';

//https://github.com/gdaws/node-stomp
var Stompit = require('stompit');
var Promise = require('promise');
var JSONRPCSerializationProvider = require('../serialization/json_rpc_serialization_provider');

function RemoteBroker(uniqueId){
    this.uniqueId = uniqueId;
    this.channel = {};
    this.serializationProvider = new JSONRPCSerializationProvider();
}


RemoteBroker.prototype.connect = function (hostname, port) {
    var remoteBroker = this;
    return new Promise(function (fulfill, reject) {
        var connectionManager = new Stompit.ConnectFailover([{
            host: hostname,
            port: port
        }]);

        var channel = new Stompit.Channel(connectionManager, { alwaysConnected: false, recoverAfterApplicationError: false});

        connectionManager.on('error', function (error) {
            var connectArgs = error.connectArgs;
            var address = connectArgs.host + ':' + connectArgs.port;
            reject(new Error('Could not connect to ' + address + ': ' + error.message));
        });
        connectionManager.on('connecting', function (connector) {
            console.log('Connecting to ' + connector.serverProperties.remoteAddress.transportPath);
        });
        connectionManager.on('connect', function () {
            remoteBroker.channel = channel;
            fulfill(remoteBroker);
        });

        channel._connect();
    });
};

RemoteBroker.prototype.subscribeAndProcess = function (handlingStrategy, amountToWait) {
    var remoteBroker = this;
    var requestQueue = '/queue/' + this.uniqueId + '.req';

    return new Promise(function (fulfill, reject) {
        remoteBroker.channel.subscribe({
            'destination': requestQueue,
            'ack': 'client-individual',
            'activemq.prefetchSize': 1
        }, function (error, message) {
            if (error) {
                reject(new Error("Subscribe error: " + error.message));
                return;
            }

            message.readString('utf-8', function (error, body) {
                if (error) {
                    reject(new Error('Read message error ' + error.message));
                    return;
                }

                message.body = body;

                try {
                    var request = remoteBroker.serializationProvider.deserialize(message);
                    handlingStrategy.processNextRequestFrom(remoteBroker, request);
                } catch (error) {
                    reject(error)
                }
            });
        });

        console.log("Waiting for requests.");
        setTimeout(function () {
            fulfill(remoteBroker)
        }, amountToWait);
    })
};

RemoteBroker.prototype.respondTo = function (request, response) {
    var remoteBroker = this;
    var responseQueue = '/queue/' + this.uniqueId + '.resp';
    var sendHeaders = {
        'destination': responseQueue,
        'content-type': 'text/json'
    };
    var serializedResponse = remoteBroker.serializationProvider.serialize(response);

    return new Promise(function (fulfill, reject) {
        remoteBroker.channel.send(sendHeaders, serializedResponse,
            function (error) {
                if (error) {
                    reject(new Error('Send error ' + error.message));
                    return;
                }

                remoteBroker.channel.ack(request.originalMessage);
                fulfill(remoteBroker);
            });
    });
};

RemoteBroker.prototype.close = function () {
    var remoteBroker = this;
    return new Promise(function (fulfill) {
        if (remoteBroker.channel._closed != true) {
            remoteBroker.channel.close();
        }
        fulfill(remoteBroker)
    });
};

module.exports = RemoteBroker;