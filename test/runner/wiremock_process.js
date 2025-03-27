'use strict';

var unirest = require('unirest');

var WiremockProcess = function (hostname, port) {
    this._serverUrl = 'http://'+hostname+':'+port
};

WiremockProcess.prototype.reset = function () {
    return this._postJson('__admin/reset');
};

WiremockProcess.prototype.createNewMapping = function (serverConfig) {
    var self = this;

    var data = {
        request: {
            method: serverConfig.verb
        },
        response: {
            status: serverConfig.status
        }
    };

    if (serverConfig.endpointEquals) {
        data.request.url = serverConfig.endpointEquals;
    }

    if (serverConfig.endpointMatches) {
        data.request.urlPattern = serverConfig.endpointMatches;
    }

    if (serverConfig.acceptHeader) {
        data.request.headers = {
            Accept: {
                contains: serverConfig.acceptHeader
            }
        };
    }

    if (serverConfig.responseBody) {
        data.response.body = serverConfig.responseBody;
    }

    if (serverConfig.statusMessage) {
        data.response.statusMessage = serverConfig.statusMessage;
    }

    return self._postJson('__admin/mappings', data);
};

WiremockProcess.prototype.verifyEndpointWasHit = function(endpoint, methodType, body) {
    var self = this;
    
    return new Promise(function(resolve) {
        self._countRequestsWithEndpoint(endpoint, methodType, body)
            .then(function(response) {
                resolve(response.count === 1)
            });
    });
};

WiremockProcess.prototype._countRequestsWithEndpoint = function(endpoint, verb, body) {
    var self = this;

    var data = {
        url: endpoint,
        method: verb
    };

    if (body) {
        data.bodyPatterns = [{
            equalTo: body
        }];
    }

    return self._postJson('__admin/requests/count', data);
};

WiremockProcess.prototype._postJson = function (method, data) {
    var self = this;

    return new Promise(function (resolve) {
        unirest
            .post(self._serverUrl+'/'+method)
            .headers({'Content-Type': 'application/json'})
            .send(data || {})
            .end(function (response) {
                resolve(response.body);
            });
    });
};

module.exports = WiremockProcess;
