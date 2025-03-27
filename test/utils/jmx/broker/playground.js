'use strict';

//Useful for debugging
var util = require('util');

function inspect(result) {
    return util.inspect(result, {showHidden: false, depth: null});
}

var JolokiaSession = require('./jolokia_session.js');

var inspectSession = function (callback) {
    return function (jolokiaSession) {
        inspect(jolokiaSession);
        console.log("jolokiaSession = ", jolokiaSession);
        typeof callback === 'function' && callback(jolokiaSession);
    }
};

var addQueue = function (callback) {
    return function (jolokiaSession) {
        var operation = {
            type: 'exec',
            mbean: 'org.apache.activemq:type=Broker,brokerName=TEST.BROKER',
            operation: 'addQueue',
            arguments: ['test.req']
        };
        jolokiaSession.request(operation, function (data) {
            console.log("addQueue.response = ", data);
            typeof callback === 'function' && callback(jolokiaSession);
        });
    };
};

var sendTextMessage = function (callback) {
    return function (jolokiaSession) {
        var operation = {
            type: 'exec',
            mbean: 'org.apache.activemq:type=Broker,brokerName=TEST.BROKER,destinationType=Queue,destinationName=test.req',
            operation: 'sendTextMessage(java.lang.String)',
            arguments: ['test message']
        };
        jolokiaSession.request(operation, function (data) {
            console.log("sendTextMessage.response = ", data);
            typeof callback === 'function' && callback(jolokiaSession);
        });
    };
};

var readQueueSize = function (callback) {
    return function (jolokiaSession) {
        var attribute = {
            type: 'read',
            mbean: 'org.apache.activemq:type=Broker,brokerName=TEST.BROKER,destinationType=Queue,destinationName=test.req',
            attribute: 'QueueSize'
        };
        jolokiaSession.request(attribute, function (data) {
            console.log("readQueueSize.response = ", data);
            typeof callback === 'function' && callback(jolokiaSession);
        });
    };
};

var browseQueues = function (callback) {
    return function (jolokiaSession) {
        var operation = {
            type: 'exec',
            mbean: 'org.apache.activemq:type=Broker,brokerName=TEST.BROKER,destinationType=Queue,destinationName=test.req',
            operation: 'browse()'
        };
        jolokiaSession.request(operation, function (data) {
            var messages = data.map(function (compositeData) {
                return compositeData["Text"];
            });
            console.log("browseQueues.response = ", messages);
            typeof callback === 'function' && callback(jolokiaSession);
        });
    };
};

var purge = function (callback) {
    return function (jolokiaSession) {
        var operation = {
            type: 'exec',
            mbean: 'org.apache.activemq:type=Broker,brokerName=TEST.BROKER,destinationType=Queue,destinationName=test.req',
            operation: 'purge()'
        };
        jolokiaSession.request(operation, function (data) {
            console.log("purge.response = ", data);
            typeof callback === 'function' && callback(jolokiaSession);
        });
    };
};


if (!module.parent) {
    JolokiaSession.connect('localhost', 28161,
        inspectSession(addQueue(sendTextMessage(readQueueSize(browseQueues(purge()))))));
}
