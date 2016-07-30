'use strict';

//https://github.com/gdaws/node-stomp
var Stompit = require('stompit');
var Promise = require('promise');

function Client(opts){
    this.hostname = opts.hostname;
    this.port = opts.port || 61613;
    this.uniqueId = opts.uniqueId;
}

Client.prototype.goLiveWith = function (processingRules) {
    var connectOptions = {
        host: this.hostname,
        port: this.port
    };
    var requestQueue = '/queue/' + this.uniqueId + '.req';
    var responseQueue = '/queue/' + this.uniqueId + '.resp';

    //noinspection BadExpressionStatementJS
    processingRules;


    return new Promise(function (fulfill, reject) {
        var connectionManager = new Stompit.ConnectFailover([connectOptions]);

        connectionManager.on('error', function(error) {
            var connectArgs = error.connectArgs;
            var address = connectArgs.host + ':' + connectArgs.port;
            reject(new Error('Could not connect to ' + address + ': ' + error.message));
        });

        connectionManager.on('connecting', function(connector) {
            console.log('Connecting to ' + connector.serverProperties.remoteAddress.transportPath);
        });

        var channelPool = Stompit.ChannelPool(connectionManager);

        channelPool.channel(function(error, channel) {
            if (error) { reject(new Error("Connect error"+error.message)); return; }

            channel.subscribe({
                'destination': requestQueue,
                'ack': 'client-individual',
                'activemq.prefetchSize': 1
            }, function (error, message, subscription) {
                if (error) { reject(new Error("Subscribe error: "+error.message)); return; }

                message.readString('utf-8', function(error, body) {
                    if (error) { reject(new Error('Read message error ' +error.message)); return; }
                    var request = JSON.parse(body);
                    var response = processingRules.getResponseFor(request);
                    console.log("Procc: ", require("util").inspect(response));

                    //if action is publish
                    if (response.clientAction.indexOf('publish') != -1){
                        console.log("Publish and acknowledge");

                        var sendHeaders = {
                            'destination': responseQueue,
                            'content-type': 'text/json'
                        };

                        channel.send(sendHeaders, JSON.stringify(response.asHash()),
                            function(error) {
                                if (error) { reject(new Error('Send error ' +error.message)); return; }

                                channel.ack(message);

                                if (response.clientAction.indexOf('stop') != -1 ) {
                                    console.log("Inner Unsubscribe");
                                    subscription.unsubscribe()
                                }
                            });
                    } else {
                        if (response.clientAction.indexOf('stop') != -1 ) {
                            console.log("Outer Unsubscribe");
                            subscription.unsubscribe()
                        }
                    }

                    //If action is stop
                });
            });

            setTimeout(function () {
                console.log("Stopping");
                channel.close();
                fulfill()
            }, 3000);
        });
    });
};

module.exports = Client;