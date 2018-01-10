'use strict';

var unirest = require('unirest');

var WiremockProcess = function(hostname, port) {
    this._serverUrl = `http://${hostname}:${port}`
}

WiremockProcess.prototype.reset = function() {
    return this._postJson('__admin/reset');
}

WiremockProcess.prototype._postJson = function(method, data) {
    return new Promise((resolve) => {
        unirest
            .post(`${this._serverUrl}/${method}`)
            .headers({'Content-Type': 'application/json'})
            .send(data || {})
            .end(function(response) {
                resolve(response);
            });
    });
}

module.exports = WiremockProcess;
