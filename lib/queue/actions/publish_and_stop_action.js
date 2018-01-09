'use strict';

function PublishAndStopAction(){}

PublishAndStopAction.prototype.getAuditText = function () {
    return "";
};

PublishAndStopAction.prototype.afterResponse = function (remoteBroker, request, response) {
    return remoteBroker.respondTo(request, response);
};

PublishAndStopAction.prototype.prepareForNextRequest = function (remoteBroker) {
    return remoteBroker.close();
};


module.exports = PublishAndStopAction;