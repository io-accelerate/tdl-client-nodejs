"use strict";
var util = require("util");
var Promise = require("promise");
var assert = require("chai").assert;
var intercept = require("intercept-stdout");

var TDL = require("../..");

var testBroker = require("../test_broker");

var HOSTNAME = "localhost";
var PORT = 21613;
var REQUEST_QUEUE_NAME = "some-user-req";
var RESPONSE_QUEUE_NAME = "some-user-resp";

var LONG_TIMEOUT = {timeout: 60 * 1000};


module.exports = function() {
  // ~~~~~ Setup
  // TODO: how do we implement this in NodeJS, like we did in Java, see https://github.com/julianghionoiu/tdl-client-java/commit/4475fc3b01bb3f6fbc2b2d423848f5dcec489461#diff-0672afec8f176ab43f4d558fe4023e5dR54
  // Cucumber does not support .And() clause in NodeJS/JS
  this.Given(
    /^I start with a clean broker having a request and a response queue$/,
    function(callback) {
      var world = this;

      testBroker
        .connect()
        .then(function(broker) {
          world.broker = broker;
          return Promise.all([
              broker.addQueueAndPurge(REQUEST_QUEUE_NAME),
              broker.addQueueAndPurge(RESPONSE_QUEUE_NAME)
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

  this.Given(/^a client that connects to the queues$/, function(callback) {
    var world = this;

    testBroker
      .connect()
      .then(function() {
        var runnerConfig = new TDL.ImplementationRunnerConfig()
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

  this.Given(/^the broker is not available$/, function(callback) {
    var world = this;

    var runnerConfig = new TDL.ImplementationRunnerConfig()
      .setHostname("111")
      .setPort(PORT)
      .setRequestQueueName("x")
      .setResponseQueueName("y");

    world.runnerBuilder = new TDL.QueryBasedImplementationRunnerBuilder().setConfig(
      runnerConfig
    );

    callback();
  });

    this.Given(/^I receive the following requests:$/, function(table, callback) {
    var world = this;
    console.log("table: " + util.inspect(table.hashes()));
    world.requestCount = table.hashes().length;

    // Send messages sequentially
    var sendAllMessages = table.hashes().reduce(function(p, row) {
      console.log("Send: " + row);
      return p.then(function() {
        return world.requestQueue.sendTextMessage(row["payload"]);
      });
    }, Promise.resolve());

    sendAllMessages.then(proceed(callback), orReportException(callback));
  });

  this.Given(/^I receive (\d+) identical requests like:$/, LONG_TIMEOUT, function(
    repeatCount,
    table,
    callback
  ) {
    var world = this;
    console.log("repeat count: " + repeatCount);
    console.log("table: " + util.inspect(table.hashes()));

    var repeatedRequests = [].concat.apply(
      [],
      Array(+repeatCount).fill(table.hashes())
    );
    world.requestCount = repeatedRequests.length;

    var sendAllMessages = repeatedRequests.reduce(function(p, row) {
      console.log("Send: " + util.inspect(row));
      return p.then(function() {
        return world.requestQueue.sendTextMessage(row["payload"]);
      });
    }, Promise.resolve());

    sendAllMessages.then(proceed(callback), orReportException(callback));
  });

  this.Then(/^the time to wait for requests is (\d+)ms$/, function(
    expectedTimeout,
    callback
  ) {
    var world = this;
    var actualTimeout = world.runnerBuilder.create().getRequestTimeoutMillisecond();
    assert.equal(actualTimeout,
        +expectedTimeout,
      "The client request timeout should be "+expectedTimeout
    );
    callback();
  });


  this.Then(/^the client should consume one request$/, function(callback) {
      var world = this;
      world.requestQueue
          .getSize()
          .then(function(size) {
              assert.equal(size, world.requestCount - 1, "Request queue size has a different value.");
          })
          .then(proceed(callback), orReportException(callback));
  });

  this.Then(/^the client should publish one response$/, function(callback) {
      var world = this;
      world.responseQueue
          .getSize()
          .then(function(size) {
              assert.equal(size, 1, "Response queue size has a different value.");
          })
          .then(proceed(callback), orReportException(callback));
  });

  // ~~~~~ Implementations

  function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if (new Date().getTime() - start > milliseconds) {
        break;
      }
    }
  }

  var USER_IMPLEMENTATIONS = {
    "add two numbers": function(x, y) {
      return x + y;
    },
    "return null": function() {
      return null;
    },
    "throw exception": function() {
      throw new Error();
    },
    "some logic": function() {
      return "_";
    },
    "increment number": function(x) {
      return x + 1;
    },
    "replay the value": function(x) {
      return x;
    },
    "sum the elements of an array": function(x) {
        return x.reduce(function(a,b){
            return a + b
        }, 0);
    },
    "generate array of integers": function(x, y) {
        var int_array = [];
        for (var i = x; i < y; i++) {
            int_array.push(i);
        }
        return int_array;
    },
    "work for 600ms": function() {
      sleep(600);
      return "OK";
    }
  };

  function asImplementation(call) {
    if (call in USER_IMPLEMENTATIONS) {
      return USER_IMPLEMENTATIONS[call];
    } else {
      throw Error("Not a valid implementation reference: " + call);
    }
  }

  this.When(/^I go live with the following processing rules:$/, LONG_TIMEOUT, function(
    table,
    callback
  ) {
    var world = this;

    table.hashes().forEach(function(rule) {
      world.runnerBuilder.withSolutionFor(
        rule.method,
        asImplementation(rule.call)
      );
    });

    world.runner = world.runnerBuilder.create();

    //Setup log capture then run
    startIntercept(world);
    var logThenCallback = function() {
      endIntercept(world);
    };

    var timestampBefore = new Date();
    world.runner
      .run()
      .then(proceed(logThenCallback), orReportException(logThenCallback))
      .then(function() {
        var timestampAfter = new Date();
        world.processingTime = timestampAfter - timestampBefore;
        console.log("Processing time: %dms", world.processingTime);
        callback();
      });
  });

  // ~~~~~ Assertions

  this.Then(/^the client should consume all requests$/, function(callback) {
    var world = this;
    world.requestQueue
      .getSize()
      .then(function(size) {
        assert.equal(size, 0, "Requests have not been consumed");
      })
      .then(proceed(callback), orReportException(callback));
  });

  this.Then(/^the client should consume first request$/, function(callback) {
    var world = this;
    world.requestQueue
      .getSize()
      .then(function(size) {
        assert.equal(
          size,
          world.requestCount - 1,
          "Requests have not been consumed"
        );
      })
      .then(proceed(callback), orReportException(callback));
  });

  this.Then(/^the client should publish the following responses:$/, function(
    table,
    callback
  ) {
    var world = this;
    var expectedMessages = table.hashes().map(function(row) {
      return row["payload"];
    });

    world.responseQueue
      .getMessageContents()
      .then(function(receivedMessages) {
        assert.deepEqual(
          receivedMessages,
          expectedMessages,
          "The responses are not correct"
        );
      })
      .then(proceed(callback), orReportException(callback));
  });

  this.Then(/^the client should display to console:$/, function(
    table,
    callback
  ) {
    var world = this;
    Promise.resolve(world.capturedText)
      .then(function(capturedText) {
        table.hashes().forEach(function(row) {
          assert.include(capturedText, row["output"]);
        });
      })
      .then(proceed(callback), orReportException(callback));
  });

  this.Then(/^the client should not consume any request$/, function(callback) {
    var world = this;
    world.requestQueue
      .getSize()
      .then(function(size) {
        assert.equal(
          size,
          world.requestCount,
          "The request queue has different size. Messages have been consumed"
        );
      })
      .then(proceed(callback), orReportException(callback));
  });

  this.Then(/^the client should not publish any response$/, function(callback) {
    var world = this;
    world.responseQueue
      .getSize()
      .then(function(size) {
        assert.equal(
          size,
          0,
          "The response queue has different size. Messages have been published"
        );
      })
      .then(proceed(callback), orReportException(callback));
  });

  this.Then(/^I should get no exception$/, function(callback) {
    //if you get here there were no exceptions
    callback();
  });

  this.Then(/^the processing time should be lower than (\d+)ms$/, function(
    threshold,
    callback
  ) {
    var world = this;
    Promise.resolve(threshold)
        .then(function(threshold) {
            var feature_threshold = +threshold;
            var cause_javascript_is_slow = 2000;
            var actual_threshold = feature_threshold + cause_javascript_is_slow;
            assert.isBelow(world.processingTime, +actual_threshold);
        })
        .then(proceed(callback), orReportException(callback));
  });
};

// ~~~~~ Helpers

function startIntercept(world) {
  world.capturedText = "";
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
    callback();
  };
}

function orReportException(callback) {
  return function(err) {
    console.log("Oops. Error: " + err);
    if (err.constructor.name === "AssertionError") {
      console.log("Assertion failed with: " + err.message);
      console.log("Expected: " + err.expected);
      console.log("Actual:   " + err.actual);
    }
    callback(err);
  };
}
