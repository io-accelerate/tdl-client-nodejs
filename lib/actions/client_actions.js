'use strict';

var PublishAction = require('./publish_action');
var StopAction = require('./stop_action');
var PublishAndStopAction = require('./publish_and_stop_action');

function ClientActions(){}

ClientActions.publish = function () {
    return new PublishAction();
};

ClientActions.stop = function () {
    return new StopAction();
};

ClientActions.publishAndStop = function () {
    return new PublishAndStopAction();
};

module.exports = ClientActions;
