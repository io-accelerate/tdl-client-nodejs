'use strict';

var Promise = require('promise');
var http = require('http');

function ChallengeServerClient(hostname, port, journeyId, useColours){
    this.hostname = hostname;
    this.port = port;
    this.journeyId = journeyId;
    this.acceptHeader = useColours ? "text/coloured" : "text/not-coloured";
}

//~~~~~~~ GET ~~~~~~~~

ChallengeServerClient.prototype.getJourneyProgress = function () {
    return this.get("journeyProgress");
};

ChallengeServerClient.prototype.getAvailableActions = function () {
    return this.get("availableActions");
};

ChallengeServerClient.prototype.getRoundDescription = function () {
    return this.get("roundDescription");
};


ChallengeServerClient.prototype.get = function (name) {
    var client = this;
    return new Promise(function (fulfill, reject) {
        var options = {
            hostname: client.hostname,
            port: client.port,
            path: `/${name}/${client.journeyId}`,
            method: 'GET',
            headers: {
                'Accept': client.acceptHeader,
                'Accept-Charset': 'UTF-8'
            }
        };

        var req = http.request(options, function (res) {
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });

            res.on('end', function () {
                res.body = data;
                ifStatusOk(res, fulfill, reject);
            });
        });

        req.on('error', function (e) {
            reject({name: "RequestError", message: e.message});
        });

        req.end();
    });
};

//~~~~~~~ POST ~~~~~~~~


ChallengeServerClient.prototype.sendAction = function (name) {
    var client = this;
    return new Promise(function (fulfill, reject){
        var options = {
            hostname: client.hostname,
            port: client.port,
            path: `/action/${name}/${client.journeyId}`,
            method: 'POST',
            headers: {
                'Accept': client.acceptHeader,
                'Accept-Charset': 'UTF-8'
            }
        };

        var req = http.request(options, function (res) {
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });

            res.on('end', function () {
                res.body = data;
                ifStatusOk(res, fulfill, reject);
            });
        });

        req.on('error', function (e) {
            reject({name: "RequestError", message: e.message});
        });

        req.end();
    });
};


//~~~~~~~ Error handling ~~~~~~~~~

function ifStatusOk(response, fulfill, reject) {
    var responseCode = response.statusCode;
    if (isClientError(responseCode)) {
        reject({name : "ClientErrorException", message : response.body});
    } else if (isServerError(responseCode)) {
        reject({name : "ServerErrorException", message : response.body});
    } else if (isOtherErrorResponse(responseCode)) {
        reject({name : "OtherCommunicationException", message : response.body});
    } else {
        fulfill(response.body);
    }
}

function isClientError(responseStatus) {
    return responseStatus >= 400 && responseStatus < 500;
}

function isServerError(responseStatus) {
    return responseStatus >= 500 && responseStatus < 600;
}

function isOtherErrorResponse(responseStatus) {
    return responseStatus < 200 || responseStatus > 300;
}

module.exports = ChallengeServerClient;
