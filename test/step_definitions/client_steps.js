'use strict';
var util = require('util');
var Promise = require('promise');
var assert = require('chai').assert;
var intercept = require("intercept-stdout");

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
            world.client = new TDL.Client({hostname: HOSTNAME, port: STOMP_PORT, uniqueId: UNIQUE_ID, timeToWaitForRequests: 500});
        }).then(proceed(callback), orReportException(callback));
    });

    this.Given(/^the broker is not available$/, function (callback) {
        var world = this;
        world.client = new TDL.Client({hostname: "111", port: STOMP_PORT, uniqueId: UNIQUE_ID});
        callback();
    });

    this.Given(/^I receive the following requests:$/, function (table, callback) {
        var world = this;
        console.log("table: " + util.inspect(table.hashes()));
        world.requestCount = table.hashes().length;

        // Send messages sequentially
        var sendAllMessages = table.hashes().reduce(function (p, row) {
            console.log("Send: " + row);
            return p.then(function () { return world.requestQueue.sendTextMessage(row["payload"])})
        }, Promise.resolve());

        sendAllMessages.then(proceed(callback), orReportException(callback));
    });

    // ~~~~~ Implementations

    const USER_IMPLEMENTATIONS = {
        'add two numbers': function (x, y) {
            return x + y
        },
        'return null': function () {
            return null
        },
        'throw exception': function () {
            throw new Error()
        },
        'some logic': function (value) {
            return value
        },
        'increment number': function (x) {
            return x + 1
        },
        'echo the request': function (x) {
            return x
        }
    };

    function asImplementation(call) {
        if (call in USER_IMPLEMENTATIONS) {
            return USER_IMPLEMENTATIONS[call]
        } else {
            throw Error("Not a valid implementation reference: "+call)
        }
    }

    var ClientActions = TDL.ClientActions;
    const CLIENT_ACTIONS = {
        'publish': ClientActions.publish(),
        'stop': ClientActions.stop(),
        'publish and stop': ClientActions.publishAndStop()
    };

    function asAction(actionName) {
        if (actionName in CLIENT_ACTIONS) {
            return CLIENT_ACTIONS[actionName]
        } else {
            throw Error("Not a valid action reference: "+call)
        }
    }

    this.When(/^I go live with the following processing rules:$/, function (table, callback) {
        var world = this;

        //Read the rules from table
        var processingRules = new TDL.ProcessingRules();
        table.hashes().forEach(function (row) {
            processingRules.on(row['method']).call(asImplementation(row['call'])).then(asAction(row['action']))
        });

        //Setup log capture then run
        startIntercept(world);
        var logThenCallback = function () {
            endIntercept(world);
            callback();
        };
        world.client.goLiveWith(processingRules)
            .then(proceed(logThenCallback), orReportException(logThenCallback));
    });

    // ~~~~~ Assertions

    this.Then(/^the client should consume all requests$/, function (callback) {
        var world = this;
        world.requestQueue.getSize().then(function (size) {
            assert.equal(size, 0, 'Requests have not been consumed');
        }).then(proceed(callback), orReportException(callback));
    });

    this.Then(/^the client should consume first request$/, function (callback) {
        var world = this;
        world.requestQueue.getSize().then(function (size) {
            assert.equal(size, world.requestCount - 1, 'Requests have not been consumed');
        }).then(proceed(callback), orReportException(callback));
    });

    this.Then(/^the client should publish the following responses:$/, function (table, callback) {
        var world = this;
        var expectedMessages = table.hashes().map(function (row) {
            return row['payload'];
        });

        world.responseQueue.getMessageContents().then(function (receivedMessages) {
            assert.deepEqual(receivedMessages, expectedMessages, 'The responses are not correct');
        }).then(proceed(callback), orReportException(callback));
    });

    this.Then(/^the client should display to console:$/, function (table, callback) {
        var world = this;
        Promise.resolve(world.capturedText).then(function (capturedText) {
            table.hashes().forEach(function (row) {
                assert.include(capturedText, row['output']);
            });
        }).then(proceed(callback), orReportException(callback));
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
        //if you get here there were no exceptions
        callback();
    });
};

// ~~~~~ Helpers

function startIntercept(world) {
    world.capturedText = '';
    world.unhookIntercept = intercept(function(txt) {
        world.capturedText += txt;
    });
}

function endIntercept(world) {
    world.unhookIntercept();
}

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
