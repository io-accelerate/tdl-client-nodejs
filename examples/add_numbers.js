"use strict";

var TDL = require("..");

function runClient() {
  var client = new TDL.Client({
    hostname: "localhost",
    port: "61613",
    requestQueueName: "julian@example.com.req",
    responseQueueName: "julian@example.com.resp"
  });

  var rules = new TDL.ProcessingRules();
  rules
    .on("display_description")
    .call(display)
    .build();
  rules
    .on("sum")
    .call(sum)
    .build();
  rules
    .on("end_round")
    .call(function() {
      return "OK";
    })
    .build();

  client.goLiveWith(rules);
}

function display(round, description) {
  console.log("%s - %s", round, description);
  return "OK";
}

function sum(x, y) {
  return x + y;
}

runClient();
