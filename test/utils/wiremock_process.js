'use strict';

var unirest = require('unirest');

var WiremockProcess = function(hostname, port) {
    this._serverUrl = `http://${hostname}:${port}`
}

WiremockProcess.prototype.reset = function() {
    return this._postJson('__admin/reset');
}

WiremockProcess.prototype.createNewMapping = function(serverConfig) {
    return this._postJson('__admin/mappings/new', {
        request: {
            urlPattern: serverConfig.endpointMatches,
            url: serverConfig.endpointEquals,
            method: serverConfig.verb,
            headers: {
                accept: {
                    contains: serverConfig.acceptHeader
                }
            }
        },
        response: {
            body: serverConfig.responseBody,
            statusMessage: serverConfig.statusMessage,
            status: serverConfig.status
        }
    });
}

WiremockProcess.prototype._postJson = function(method, data) {
    var self = this;

    return new Promise(function(resolve) {
        unirest
            .post(`${self._serverUrl}/${method}`)
            .headers({'Content-Type': 'application/json'})
            .send(data || {})
            .end(function(response) {
                resolve(response);
            });
    });
}

module.exports = WiremockProcess;
