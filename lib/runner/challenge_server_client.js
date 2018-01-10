'use strict';

var Promise = require('promise');
var unirest = require('unirest');
var PORT = 8222;

function ChallengeServerClient(baseDomain, journeyId, useColours){
    this.baseDomain = baseDomain;
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
    return new Promise(function (fulfill, reject){
        unirest
            .get("http://"+client.baseDomain+":"+PORT+"/"+name+"/"+client.journeyId)
            .header("Accept", client.acceptHeader)
            .header("Accept-Charset", "UTF-8")
            .end(function (response) {
                ifStatusOk(response, fulfill, reject)
            })
    });
};

//~~~~~~~ POST ~~~~~~~~


ChallengeServerClient.prototype.sendAction = function (name) {
    var client = this;
    return new Promise(function (fulfill, reject){
        unirest
            .post("http://"+client.baseDomain+":"+PORT+"/action/"+name+"/"+client.journeyId)
            .header("Accept", client.acceptHeader)
            .header("Accept-Charset", "UTF-8")
            .end(function (response) {
                ifStatusOk(response, fulfill, reject)
            })
    });
};


//~~~~~~~ Error handling ~~~~~~~~~

function ifStatusOk(response, fulfill, reject) {
    var responseCode = response.code;
    if (isClientError(responseCode)) {
        reject({name : "ClientErrorException", message : response.body});
    } else if (isServerError(responseCode)) {
        reject({name : "ServerErrorException", message : response.error});
    } else if (isOtherErrorResponse(responseCode)) {
        reject({name : "OtherCommunicationException", message : response.error});
    } else {
        fulfill(response.body)
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