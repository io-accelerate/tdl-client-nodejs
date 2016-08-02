'use strict';

var PublishAction = require('./publish_action');
var StopAction = require('./stop_action');
var PublishAndStopAction = require('./publish_and_stop_action');

module.exports.publish = function () {
    return new PublishAction();
};

module.exports.stop = function () {
    return new StopAction();
};

module.exports.publishAndStop = function () {
    return new PublishAndStopAction();
};

