import http from 'node:http';

const WiremockProcess = function (hostname, port) {
    this._serverUrl = 'http://' + hostname + ':' + port;
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

WiremockProcess.prototype.verifyEndpointWasHit = function (endpoint, methodType, body) {
    var self = this;

    return new Promise(function (resolve) {
        self._countRequestsWithEndpoint(endpoint, methodType, body)
            .then(function (response) {
                resolve(response.count === 1);
            });
    });
};

WiremockProcess.prototype._countRequestsWithEndpoint = function (endpoint, verb, body) {
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

    return new Promise(function (resolve, reject) {
        var postData = JSON.stringify(data || {});

        var url = new URL(self._serverUrl + '/' + method);
        var options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        var req = http.request(options, (res) => {
            let rawData = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                rawData += chunk;
            });
            res.on('end', () => {
                if (rawData) {
                    try {
                        const parsedData = JSON.parse(rawData);
                        resolve(parsedData);
                    } catch (e) {
                        reject(new Error('Failed to parse JSON: ' + e.message));
                    }
                } else {
                    resolve({}); // Resolve with an empty object if no data
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(postData);
        req.end();
    });
};

export default WiremockProcess;
