'use strict';

var TDL = require('..');
var publish = TDL.ClientActions.publish;
var publishAndStop = TDL.ClientActions.publishAndStop;

function runClient() {
    var client = new TDL.Client({hostname: 'localhost', port: '61613', uniqueId: 'julian@example.com'});

    var rules = new TDL.ProcessingRules();
    rules.on('display_description').call(display).then(publish());
    rules.on('sum').call(sum).then(publish());
    rules.on('end_round').call(function () {return 'OK'}).then(publishAndStop());

    // console.log(require('util').inspect(rules));

    client.goLiveWith(rules)
}

function display(round, description) {
    console.log("%s - %s", round, description);
    return 'OK'
}

function sum(x, y) {
    return x + y
}

runClient();

