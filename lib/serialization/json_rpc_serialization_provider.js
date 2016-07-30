'use strict';

var Request = require('../abstractions/request');

function JSONRPCSerializationProvider(){}

JSONRPCSerializationProvider.prototype.deserialize = function (msg) {
    var requestData = JSON.parse(msg.body);
    return new Request(msg, requestData)
};

JSONRPCSerializationProvider.prototype.serialize = function (response) {
    return JSON.stringify(response.asHash());
};


module.exports = JSONRPCSerializationProvider;