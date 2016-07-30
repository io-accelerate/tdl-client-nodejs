'use strict';

var Promise = require('promise');

function PublishAction(){}

PublishAction.prototype.getAuditText = function () {
    return "";
};

PublishAction.prototype.afterResponse = function (remoteBroker, request, response) {
    return remoteBroker.respondTo(request, response);
};

PublishAction.prototype.prepareForNextRequest = function (remoteBroker) {
    return Promise.resolve(remoteBroker);
};


module.exports = PublishAction;