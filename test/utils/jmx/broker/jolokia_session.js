'use strict';

var http = require('http');

var onSuccessfulResponse = function (callback) {
    return function (res) {
        if (res.statusCode != 200) {
            throw "Request to failed with status: " + res.statusCode + ", message = "+res.statusMessage
        }

        var body = '';
        res.on('data', function (d) {
            body += d;
        });
        res.on('end', function () {
            callback(body);
        });
    }
};

//~~~~~ Class definition

var JolokiaSession = function (host, adminPort) {
    this.host = host;
    this.adminPort = adminPort;
};

JolokiaSession.connect = function (host, admin_port, onConnectCallback) {
    var req = http.request({
        method: 'GET',
        host: host,
        port: admin_port,
        path: '/api/jolokia/version'
    }, onSuccessfulResponse(function (body) {
        var jolokia_version = JSON.parse(body).value.agent;
        var expected_jolokia_version = '1.2.2';

        if (jolokia_version != expected_jolokia_version) {
            throw "Failed to retrieve the right Jolokia version. Expected: "+expected_jolokia_version+" got "+jolokia_version;
        }

        onConnectCallback(new JolokiaSession(host, admin_port))
    }));

    req.end();
};

JolokiaSession.prototype.request = function (jolokiaPayload, onResponseCallback) {
    var jsonPayload = JSON.stringify(jolokiaPayload);

    var req = http.request({
        method: 'POST',
        host: this.host,
        port: this.adminPort,
        path: '/api/jolokia'
    }, onSuccessfulResponse(function (body) {
        var responseValue = JSON.parse(body).value;
        onResponseCallback(responseValue)
    }));

    req.write(jsonPayload);
    req.end();
};

module.exports = JolokiaSession;