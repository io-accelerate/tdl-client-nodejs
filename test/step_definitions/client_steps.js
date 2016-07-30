'use strict';
var util = require('util');
var Promise = require('promise');
var assert = require('chai').assert;

var RemoteJmxBroker = require('../utils/jmx/broker/remote_jmx_broker.js');
var TDL = require('../..');

// Jolokia JMX definition
const HOSTNAME = 'localhost';
const JMX_PORT = 28161;
const BROKER_NAME = 'TEST.BROKER';

// Broker client definition
const STOMP_PORT = 21613;
const UNIQUE_ID = 'test@example.com';


module.exports = function () {

    // ~~~~~ Setup

    this.Given(/^I start with a clean broker$/, function (callback) {
        var world = this;
        RemoteJmxBroker.connect(HOSTNAME, JMX_PORT, BROKER_NAME).then(function (broker) {
            world.broker = broker;
            return Promise.all([
                broker.addQueueAndPurge(UNIQUE_ID + ".req"),
                broker.addQueueAndPurge(UNIQUE_ID + ".resp")
                ]);
        }).then(function (queues) {
            console.log("Saving queues: " + queues);
            world.requestQueue = queues[0];
            world.responseQueue = queues[1];
            world.client = new TDL.Client({hostname: HOSTNAME, port: STOMP_PORT, uniqueId: UNIQUE_ID});
        }).then(proceed(callback), orReportException(callback));
    });

    this.Given(/^the broker is not available$/, function (callback) {
        // Write code here that turns the phrase above into concrete actions
        callback(null, 'pending');
    });

    this.Given(/^I receive the following requests:$/, function (table, callback) {
        var world = this;
        console.log("table: " + util.inspect(table.raw()));
        world.requestCount = table.raw.length;

        // Send messages sequentially
        var sendAllMessages = table.raw().reduce(function (p, row) {
            return p.then(world.requestQueue.sendTextMessage(row[0]))
        }, Promise.resolve());

        sendAllMessages.then(proceed(callback), orReportException(callback));
    });

    // ~~~~~ Implementations

    this.When(/^I go live with the following processing rules:$/, function (table, callback) {
        var world = this;

        var Builder = function(instance, methodName) {
            this.instance = instance;
            this.methodName = methodName;
            return this;
        };
        Builder.prototype.call = function (userImplementation) {
            this.userImplementation = userImplementation;
            return this;
        };
        Builder.prototype.then = function (clientAction) {
            this.instance.add(this.methodName, this.userImplementation, clientAction)
        };

        //noinspection JSUnusedGlobalSymbols
        var processingRules = {
            rules: {},

           on: function (methodName) {
               return new Builder(this, methodName);
           },

           add: function (methodName, userImplementation, clientAction) {
               this.rules[methodName] = { userImplementation: userImplementation, clientAction: clientAction}
           },

            getResponseFor: function (request) {
                var processingRule = this.rules[request.method];
                return { id: request.id, result: "x", clientAction: processingRule.clientAction}
            }
        };
        table.hashes().forEach(function (rowObj) {
            console.log("rowObj: ", util.inspect(rowObj));
            processingRules.on(rowObj['Method']).call(rowObj['Call']).then(rowObj['Action'])
        });

        console.log(util.inspect(processingRules));
        // var processingRules = {
        //     sum: { clientAction : "publish" },
        //     increment: { clientAction : "publish" }
        // };
        world.client.goLiveWith(processingRules)
            .then(proceed(callback), orReportException(callback));
    });

    // ~~~~~ Assertions

    this.Then(/^the client should consume all requests$/, function (callback) {
        var world = this;
        world.requestQueue.getSize().then(function (size) {
            assert.equal(size, 0, 'Requests have not been consumed');
        }).then(proceed(callback), orReportException(callback));
    });

    this.Then(/^the client should consume first request$/, function (callback) {
        // Write code here that turns the phrase above into concrete actions
        callback(null, 'pending');
    });

    this.Then(/^the client should publish the following responses:$/, function (table, callback) {
        var world = this;
        var expectedMessages = table.raw().map(function (row) {
            return row[0];
        });

        world.responseQueue.getMessageContents().then(function (receivedMessages) {
            assert.deepEqual(receivedMessages, expectedMessages, 'The responses are not correct');
        }).then(proceed(callback), orReportException(callback));
    });

    this.Then(/^the client should display to console:$/, function (table, callback) {
        // Write code here that turns the phrase above into concrete actions
        callback(null, 'pending');
    });

    this.Then(/^the client should not consume any request$/, function (callback) {
        var world = this;
        world.requestQueue.getSize().then(function (size) {
            assert.equal(size, world.requestCount, 'The request queue has different size. Messages have been consumed');
        }).then(proceed(callback), orReportException(callback));
    });

    this.Then(/^the client should not publish any response$/, function (callback) {
        var world = this;
        world.responseQueue.getSize().then(function (size) {
            assert.equal(size, 0, 'The response queue has different size. Messages have been published');
        }).then(proceed(callback), orReportException(callback));

    });

    this.Then(/^I should get no exception$/, function (callback) {
        // Write code here that turns the phrase above into concrete actions
        callback(null, 'pending');
    });
};

// ~~~~~ Helpers

function proceed(callback) {
    return function() {
        console.log("All Good. Continue.");
        callback()
    };
}

function orReportException(callback) {
    return function(err) {
        console.log("Oops. Error.");
        if (err.constructor.name == 'AssertionError') {
            console.log("Assertion failed with: " + err.message);
            console.log("Expected: " + err.expected);
            console.log("Actual:   " + err.actual);
        }
        callback(err);
    };
}
