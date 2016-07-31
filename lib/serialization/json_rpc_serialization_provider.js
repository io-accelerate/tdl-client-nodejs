'use strict';

var Request = require('../abstractions/request');

function JSONRPCSerializationProvider(){}

JSONRPCSerializationProvider.prototype.deserialize = function (msg) {
    try {
        var requestData = JSON.parse(msg.body);
        return new Request(msg, requestData)
    } catch (error) {
        error.message = "Invalid message format. " + error.message;
        throw(error);
    }
};

JSONRPCSerializationProvider.prototype.serialize = function (response) {
    return JSON.stringify(response.asHash());
};


module.exports = JSONRPCSerializationProvider;