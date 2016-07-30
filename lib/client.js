'use strict';

var util = require('util');

//https://github.com/easternbloc/node-stomp-client
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
        Stompit.connect(connectOptions, function (error, client) {
            if (error) { reject(new Error("Connect error"+error.message)); return; }

            client.subscribe({
                'destination': requestQueue,
                'ack': 'client-individual',
                'activemq.prefetchSize': 1
            }, function (error, message) {
                if (error) { reject(new Error("Subscribe error: "+error.message)); return; }

                message.readString('utf-8', function(error, body) {
                    if (error) { reject(new Error('Read message error ' +error.message)); return; }
                    var request = JSON.parse(body);

                    var response = '';
                    var result = '';

                    if (request.method == 'sum') {
                        result = request.params[0] + request.params[1];
                        response = {
                            result: result,
                            error: null,
                            id: request.id
                        }
                    } else if (request.method == 'increment') {
                        result = request.params[0] + 1;
                        response = {
                            result: result,
                            error: null,
                            id: request.id
                        }
                    } else {
                        reject(new Error("No such method"))
                    }

                    var processingRule = processingRules.getResponseFor(request);

                    //if action is publish
                    if (processingRule.clientAction == 'publish') {
                        console.log("Publish and acknowledge");

                        var sendHeaders = {
                            'destination': responseQueue,
                            'content-type': 'text/json'
                        };

                        var frame = client.send(sendHeaders);
                        frame.write(JSON.stringify(response));
                        frame.end();

                        client.ack(message)
                    }

                    //If action is stop
                    if (processingRule.clientAction == 'stop') {
                        console.log("Stopping");
                        client.disconnect( function () {
                            fulfill()
                        })
                    }
                });
            });

            setTimeout(function () {
                //noinspection JSUnresolvedFunction
                client.disconnect( function () {
                    fulfill()
                })
            }, 3000);
        });
    });
};

module.exports = Client;