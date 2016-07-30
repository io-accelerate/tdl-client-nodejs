'use strict';

function StopAction(){}

StopAction.prototype.getAuditText = function () {
    return "(NOT PUBLISHED)";
};

StopAction.prototype.afterResponse = function (remoteBroker) {
    return Promise.resolve(remoteBroker)
};

StopAction.prototype.prepareForNextRequest = function (remoteBroker) {
    return remoteBroker.close();
};

module.exports = StopAction;
