'use strict';


var RemoteJmxQueue = function (jolokiaSession, brokerName, queueName) {
    this.jolokiaSession = jolokiaSession;
    this.queueBean = 'org.apache.activemq:type=Broker,brokerName=' + brokerName + ',destinationType=Queue,destinationName=' + queueName;
};

RemoteJmxQueue.prototype.purge = function () {
    var self = this;
    return new Promise(function (fulfill) {
        var operation = {
            type: 'exec',
            mbean: self.queueBean,
            operation: 'purge()'
        };
        console.log("Purging queue: " + self.queueName);
        self.jolokiaSession.request(operation, function () {
            fulfill(self)
        });
    });
};

RemoteJmxQueue.prototype.sendTextMessage = function (request) {
    var self = this;
    return new Promise(function (fulfill) {
        var operation = {
            type: 'exec',
            mbean: self.queueBean,
            operation: 'sendTextMessage(java.lang.String)',
            arguments: [request]
        };
        self.jolokiaSession.request(operation, function (data) {
            console.log("sendTextMessage.response = ", data);
            fulfill();
        });
    });
};

RemoteJmxQueue.prototype.getSize = function () {
    var self = this;
    return new Promise(function (fulfill) {
        var attribute = {
            type: 'read',
            mbean: self.queueBean,
            attribute: 'QueueSize'
        };
        self.jolokiaSession.request(attribute, function (data) {
            console.log("readQueueSize.response = ", data);
            fulfill(data);
        });
    });
};

RemoteJmxQueue.prototype.getMessageContents = function () {
    var self = this;
    return new Promise(function (fulfill) {
        var operation = {
            type: 'exec',
            mbean: self.queueBean,
            operation: 'browse()'
        };
        self.jolokiaSession.request(operation, function (compositeDataArray) {
            var messages;
            messages = compositeDataArray.map(function (compositeData) {
                if ('Text' in compositeData) {
                    return compositeData['Text'];
                } else {
                    return new Buffer(compositeData['BodyPreview']).toString('utf8');
                }
            });
            console.log("browseQueues.response.messages = ", messages);

            fulfill(messages);
        });
    });
};


module.exports = RemoteJmxQueue;