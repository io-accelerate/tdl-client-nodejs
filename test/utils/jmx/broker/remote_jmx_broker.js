'use strict';

var JolokiaSession = require('./jolokia_session.js');
var RemoteJmxQueue = require('./remote_jmx_queue.js');

var RemoteJmxBroker = function (jolokiaSession, brokerName) {
    this.jolokiaSession = jolokiaSession;
    this.brokerName = brokerName;
};

RemoteJmxBroker.connect = function (host, port, brokerName) {
    return new Promise(function (fulfill) {
        JolokiaSession.connect(host, port, function (jolokiaSession) {
            fulfill(new RemoteJmxBroker(jolokiaSession, brokerName))
        });
    })
};

RemoteJmxBroker.prototype.addQueue = function (queueName) {
    var self = this;
    return new Promise(function (fulfill) {
        var operation = {
            type: 'exec',
            mbean: "org.apache.activemq:type=Broker,brokerName="+self.brokerName,
            operation: 'addQueue',
            arguments: [queueName]
        };
        console.log("Adding queue: " + queueName);
        self.jolokiaSession.request(operation, function() {
            fulfill(new RemoteJmxQueue(self.jolokiaSession, self.brokerName, queueName));
        })
    });
};

RemoteJmxBroker.prototype.addQueueAndPurge = function (queueName) {
    return this.addQueue(queueName).then(function (queue) {
        return queue.purge()
    });
};

module.exports = RemoteJmxBroker;
