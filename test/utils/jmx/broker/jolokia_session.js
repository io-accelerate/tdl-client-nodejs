'use strict';

var http = require('http');

http.get({
    host: 'personatestuser.org',
    path: '/email'
}, function(response) {
    // Continuously update stream with data
    var body = '';
    response.on('data', function(d) {
        body += d;
    });
    response.on('end', function() {

        // Data reception is done, do whatever with it!
        var parsed = JSON.parse(body);
        callback({
            email: parsed.email,
            password: parsed.pass
        });
    });
});

var JolokiaSession = function () {};

JolokiaSession.connect = function (host, admin_port, callback) {
    // var jolokia_url = "http://#{host}:#{admin_port}/api/jolokia";
    // var endpoint = '/version';

    function simpleGet() {
        return http.get({
            host: host,
            port: admin_port,
            path: '/api/jolokia/version'
        }, function(res) {
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log('BODY: ' + chunk);
            });
        });
    }

    simpleGet();
    // var jolokia_version = JSON.parse(simpleGet()).value.agent;

    // var jolokia_version = '1.1.1';
    // var expected_jolokia_version = '1.2.2';
    //
    // if (jolokia_version != expected_jolokia_version) {
    //     throw "Failed to retrieve the right Jolokia version. Expected: #{expected_jolokia_version} got #{jolokia_version}";
    // }

    callback(new JolokiaSession("ses"));
};

// JolokiaSession.prototype.request = function () {
//
//     return {
//         'X' : 'Y'
//     }
// };

module.exports = JolokiaSession;