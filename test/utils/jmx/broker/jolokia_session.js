'use strict';

var http = require('http');

var onSuccessfulResponse = function (callback) {
    return function (res) {
        if (res.statusCode !== 200) {
            throw "Request to failed with status: " + res.statusCode + ", message = " + res.statusMessage
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

JolokiaSession.connect = function (host, admin_port, callback) {
    var req = http.request({
        method: 'GET',
        host: host,
        port: admin_port,
        path: "/api/jolokia/version",
        headers: {
            'Origin': 'http://localhost'
        }
    }, function (res) {
        if (res.statusCode !== 200) {
            throw new Error(`Failed to connect to Jolokia. Status code: ${res.statusCode}`);
        }

        var body = '';
        res.on('data', function (d) {
            body += d;
        });
        res.on('end', function () {
            callback(new JolokiaSession(host, admin_port));
        });
    });

    req.end();
};

JolokiaSession.prototype.request = function (jolokiaPayload, callback) {
    var jsonPayload = JSON.stringify(jolokiaPayload);

    var req = http.request({
        method: 'POST',
        host: this.host,
        port: this.adminPort,
        path: '/api/jolokia',
        headers: {
            'Origin': 'http://localhost'
        }
    }, function (res) {
        var body = '';
        res.on('data', function (d) {
            body += d;
        });
        res.on('end', function () {
            if (res.statusCode !== 200) {
                var msg = `Failed Jolokia call: ${res.statusCode} ${body}`;
                throw new Error(msg);
            }
            var jolokiaResponse = JSON.parse(body);
            callback(jolokiaResponse.value);
        });
    });

    req.write(jsonPayload);
    req.end();
};

module.exports = JolokiaSession;
