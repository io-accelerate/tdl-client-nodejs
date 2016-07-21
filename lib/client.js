'use strict';

//https://github.com/easternbloc/node-stomp-client
var Stomp = require('stomp-client');
var Promise = require('promise');

function Client(opts){
    this.hostname = opts.hostname;
    this.port = opts.port || 61613;
    this.uniqueId = opts.uniqueId;
}

Client.prototype.goLiveWith = function (processingRules) {
    var requestQueue = '/queue/' + this.uniqueId + '.req';
    var responseQueue = '/queue/' + this.uniqueId + '.resp';
    var stompClient = new Stomp({host: this.hostname, port: this.port});

    //noinspection BadExpressionStatementJS
    processingRules;

    return new Promise(function (fulfill, reject) {
        var onConnect = function () {
            //noinspection JSUnresolvedFunction
            stompClient.subscribe(requestQueue, function (body) {
                console.log('Received:', body);
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


                //noinspection JSUnresolvedFunction
                stompClient.publish(responseQueue, JSON.stringify(response));
            });

            setTimeout(function () {
                //noinspection JSUnresolvedFunction
                stompClient.disconnect( function () {
                    fulfill()
                })
            }, 3000);
        };
        var onError = function (err) {
            reject(err);
        };
        stompClient.connect(onConnect, onError);
    });
};

module.exports = Client;