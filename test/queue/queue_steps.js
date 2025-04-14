"use strict";

const util = require("util");
const Promise = require("promise");
const intercept = require("intercept-stdout");
const {Given, When, Then} = require("@cucumber/cucumber");
const assert = require("assert");

const TDL = require("../..");
const testBroker = require("../test_broker");

const HOSTNAME = "localhost";
const PORT = 21613;
const REQUEST_QUEUE_NAME = "some-user-req";
const RESPONSE_QUEUE_NAME = "some-user-resp";
const LONG_TIMEOUT = {timeout: 60 * 1000};

// ~~~~~ Setup

Given(
    /^I start with a clean broker having a request and a response queue$/,
    function (callback) {
        const world = this;

        testBroker
            .connect()
            .then(function (broker) {
                world.broker = broker;
                return Promise.all([
                    broker.addQueueAndPurge(REQUEST_QUEUE_NAME),
                    broker.addQueueAndPurge(RESPONSE_QUEUE_NAME),
                ]);
            })
            .then(function (queues) {
                console.log("Saving queues: " + queues);
                world.requestQueue = queues[0];
                world.responseQueue = queues[1];
            })
            .then(proceed(callback), orReportException(callback));
    }
);

Given(/^a client that connects to the queues$/, function (callback) {
    const world = this;

    testBroker
        .connect()
        .then(function () {
            const runnerConfig = new TDL.ImplementationRunnerConfig()
                .setHostname(HOSTNAME)
                .setPort(PORT)
                .setRequestQueueName(REQUEST_QUEUE_NAME)
                .setResponseQueueName(RESPONSE_QUEUE_NAME);

            world.runnerBuilder = new TDL.QueryBasedImplementationRunnerBuilder().setConfig(
                runnerConfig
            );
        })
        .then(proceed(callback), orReportException(callback));
});

Given(/^the broker is not available$/, function (callback) {
    const world = this;

    const runnerConfig = new TDL.ImplementationRunnerConfig()
        .setHostname("111")
        .setPort(PORT)
        .setRequestQueueName("x")
        .setResponseQueueName("y");

    world.runnerBuilder = new TDL.QueryBasedImplementationRunnerBuilder().setConfig(
        runnerConfig
    );

    callback();
});

Given(/^I receive the following requests:$/, function (table, callback) {
    const world = this;
    console.log("table: " + util.inspect(table.hashes()));
    world.requestCount = table.hashes().length;

    // Send messages sequentially
    const sendAllMessages = table.hashes().reduce(function (p, row) {
        console.log("Send: " + row);
        return p.then(function () {
            return world.requestQueue.sendTextMessage(row["payload"]);
        });
    }, Promise.resolve());

    sendAllMessages.then(proceed(callback), orReportException(callback));
});

Given(
    /^I receive (\d+) identical requests like:$/,
    LONG_TIMEOUT,
    function (repeatCount, table, callback) {
        const world = this;
        console.log("repeat count: " + repeatCount);
        console.log("table: " + util.inspect(table.hashes()));

        const repeatedRequests = [].concat.apply(
            [],
            Array(+repeatCount).fill(table.hashes())
        );
        world.requestCount = repeatedRequests.length;

        const sendAllMessages = repeatedRequests.reduce(function (p, row) {
            console.log("Send: " + util.inspect(row));
            return p.then(function () {
                return world.requestQueue.sendTextMessage(row["payload"]);
            });
        }, Promise.resolve());

        sendAllMessages.then(proceed(callback), orReportException(callback));
    }
);

Then(/^the time to wait for requests is (\d+)ms$/, function (
    expectedTimeout,
    callback
) {
    const world = this;
    const actualTimeout = world.runnerBuilder
        .create()
        .getRequestTimeoutMillisecond();
    assert.strictEqual(
        actualTimeout,
        +expectedTimeout,
        "The client request timeout should be " + expectedTimeout
    );
    callback();
});

Then(/^the client should consume one request$/, function (callback) {
    const world = this;
    world.requestQueue
        .getSize()
        .then(function (size) {
            assert.strictEqual(
                size,
                world.requestCount - 1,
                "Request queue size has a different value."
            );
        })
        .then(proceed(callback), orReportException(callback));
});

Then(/^the client should publish one response$/, function (callback) {
    const world = this;
    world.responseQueue
        .getSize()
        .then(function (size) {
            assert.strictEqual(size, 1, "Response queue size has a different value.");
        })
        .then(proceed(callback), orReportException(callback));
});

// ~~~~~ Implementations

function sleep(milliseconds) {
    const start = new Date().getTime();
    for (let i = 0; i < 1e7; i++) {
        if (new Date().getTime() - start > milliseconds) {
            break;
        }
    }
}

class TestItem {
    constructor({ field1, field2 }) {
        this.field1 = field1;
        this.field2 = field2;
    }
}

const USER_IMPLEMENTATIONS = {
    "add two numbers": function (x, y) {
        return x + y;
    },
    "return null": function () {
        return null;
    },
    "throw exception": function () {
        throw new Error();
    },
    "some logic": function () {
        return "_";
    },
    "increment number": function (x) {
        return x + 1;
    },
    "replay the value": function (x) {
        return x;
    },
    "sum the elements of an array": function (x) {
        return x.reduce(function (a, b) {
            return a + b;
        }, 0);
    },
    "generate array of integers": function (x, y) {
        const int_array = [];
        for (let i = x; i < y; i++) {
            int_array.push(i);
        }
        return int_array;
    },
    "work for 600ms": function () {
        sleep(600);
        return "OK";
    },
    "concatenate fields as string": function (obj) {
        const item = new TestItem(obj);
        return item.field1 + item.field2;
    },
    "build an object with two fields": function (field1, field2) {
        return { "field1": field1, "field2": field2 };
    },
    "retrieve a value from a map": function (param_as_map)  {
        return param_as_map["key1"];
    },
};

function asImplementation(call) {
    if (call in USER_IMPLEMENTATIONS) {
        return USER_IMPLEMENTATIONS[call];
    } else {
        throw Error("Not a valid implementation reference: " + call);
    }
}

When(
    /^I go live with the following processing rules:$/,
    LONG_TIMEOUT,
    function (table, callback) {
        const world = this;

        table.hashes().forEach(function (rule) {
            world.runnerBuilder.withSolutionFor(
                rule.method,
                asImplementation(rule.call)
            );
        });

        world.runner = world.runnerBuilder.create();

        // Setup log capture then run
        startIntercept(world);
        const logThenCallback = function () {
            endIntercept(world);
        };

        const timestampBefore = new Date();
        world.runner
            .run()
            .then(proceed(logThenCallback), orReportException(logThenCallback))
            .then(function () {
                const timestampAfter = new Date();
                world.processingTime = timestampAfter - timestampBefore;
                console.log("Processing time: %dms", world.processingTime);
                callback();
            });
    }
);

// ~~~~~ Assertions

Then(/^the client should consume all requests$/, function (callback) {
    const world = this;
    world.requestQueue
        .getSize()
        .then(function (size) {
            assert.strictEqual(size, 0, "Requests have not been consumed");
        })
        .then(proceed(callback), orReportException(callback));
});

Then(/^the client should consume first request$/, function (callback) {
    const world = this;
    world.requestQueue
        .getSize()
        .then(function (size) {
            assert.strictEqual(
                size,
                world.requestCount - 1,
                "Requests have not been consumed"
            );
        })
        .then(proceed(callback), orReportException(callback));
});

Then(/^the client should publish the following responses:$/, function (
    table,
    callback
) {
    const world = this;
    const expectedMessages = table.hashes().map(function (row) {
        return row["payload"];
    });

    world.responseQueue
        .getMessageContents()
        .then(function (receivedMessages) {
            assert.deepStrictEqual(
                receivedMessages,
                expectedMessages,
                "The responses are not correct"
            );
        })
        .then(proceed(callback), orReportException(callback));
});

Then(/^the client should display to console:$/, function (table, callback) {
    const world = this;
    Promise.resolve(world.capturedText)
        .then(function (capturedText) {
            table.hashes().forEach(function (row) {
                assert.ok(capturedText.includes(row["output"]));
            });
        })
        .then(proceed(callback), orReportException(callback));
});

Then(/^the client should not consume any request$/, function (callback) {
    const world = this;
    world.requestQueue
        .getSize()
        .then(function (size) {
            assert.strictEqual(
                size,
                world.requestCount,
                "The request queue has different size. Messages have been consumed"
            );
        })
        .then(proceed(callback), orReportException(callback));
});

Then(/^the client should not publish any response$/, function (callback) {
    const world = this;
    world.responseQueue
        .getSize()
        .then(function (size) {
            assert.strictEqual(
                size,
                0,
                "The response queue has different size. Messages have been published"
            );
        })
        .then(proceed(callback), orReportException(callback));
});

Then(/^I should get no exception$/, function (callback) {
    // if you get here there were no exceptions
    callback();
});

Then(/^the processing time should be lower than (\d+)ms$/, function (
    threshold,
    callback
) {
    const world = this;
    Promise.resolve(threshold)
        .then(function (threshold) {
            const feature_threshold = +threshold;
            const cause_javascript_is_slow = 2000;
            const actual_threshold = feature_threshold + cause_javascript_is_slow;
            assert.ok(world.processingTime < actual_threshold);
        })
        .then(proceed(callback), orReportException(callback));
});

// ~~~~~ Helpers

function startIntercept(world) {
    world.capturedText = "";
    world.unhookIntercept = intercept(function (txt) {
        world.capturedText += txt;
    });
}

function endIntercept(world) {
    world.unhookIntercept();
}

function proceed(callback) {
    return function () {
        console.log("All Good. Continue.");
        callback();
    };
}

function orReportException(callback) {
    return function (err) {
        console.log("Oops. Error: " + err);
        if (err.constructor.name === "AssertionError") {
            console.log("Assertion failed with: " + err.message);
            console.log("Expected: " + err.expected);
            console.log("Actual:   " + err.actual);
        }
        callback(err);
    };
}
