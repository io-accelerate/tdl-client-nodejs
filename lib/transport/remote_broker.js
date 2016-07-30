'use strict';

var Stompit = require('stompit');
var Promise = require('promise');

function RemoteBroker(uniqueId){
    this.uniqueId = uniqueId;
    this.channel = {};
}


RemoteBroker.prototype.connect = function (hostname, port) {
    var remoteBroker = this;
    return new Promise(function (fulfill, reject) {
        var connectionManager = new Stompit.ConnectFailover([{
            host: hostname,
            port: port
        }]);
        connectionManager.on('error', function (error) {
            var connectArgs = error.connectArgs;
            var address = connectArgs.host + ':' + connectArgs.port;
            reject(new Error('Could not connect to ' + address + ': ' + error.message));
        });
        connectionManager.on('connecting', function (connector) {
            console.log('Connecting to ' + connector.serverProperties.remoteAddress.transportPath);
        });

        var channelPool = Stompit.ChannelPool(connectionManager);

        channelPool.channel(function (error, channel) {
            if (error) {
                reject(new Error("Connect error" + error.message));
            } else {
                remoteBroker.channel = channel;
                fulfill(remoteBroker)
            }
        })
    });
};

RemoteBroker.prototype.subscribe = function (processingRules) {
    var remoteBroker = this;
    var requestQueue = '/queue/' + this.uniqueId + '.req';
    var responseQueue = '/queue/' + this.uniqueId + '.resp';

    return new Promise(function (fulfill, reject) {
        remoteBroker.channel.subscribe({
            'destination': requestQueue,
            'ack': 'client-individual',
            'activemq.prefetchSize': 1
        }, function (error, message, subscription) {
            if (error) {
                reject(new Error("Subscribe error: " + error.message));
                return;
            }

            message.readString('utf-8', function (error, body) {
                if (error) {
                    reject(new Error('Read message error ' + error.message));
                    return;
                }
                var request = JSON.parse(body);
                var response = processingRules.getResponseFor(request);
                console.log("Procc: ", require("util").inspect(response));

                //if action is publish
                if (response.clientAction.indexOf('publish') != -1) {
                    console.log("Publish and acknowledge");

                    var sendHeaders = {
                        'destination': responseQueue,
                        'content-type': 'text/json'
                    };

                    remoteBroker.channel.send(sendHeaders, JSON.stringify(response.asHash()),
                        function (error) {
                            if (error) {
                                reject(new Error('Send error ' + error.message));
                                return;
                            }

                            remoteBroker.channel.ack(message);

                            if (response.clientAction.indexOf('stop') != -1) {
                                console.log("Inner Unsubscribe");
                                subscription.unsubscribe()
                            }
                        });
                } else {
                    if (response.clientAction.indexOf('stop') != -1) {
                        console.log("Outer Unsubscribe");
                        subscription.unsubscribe()
                    }
                }

                //If action is stop
            });
        });

        setTimeout(function () {
            console.log("Stopping");
            remoteBroker.channel.close();
            fulfill()
        }, 3000);
    })
};

module.exports = RemoteBroker;