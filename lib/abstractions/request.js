'use strict';

function Request(originalMessage, requestData){
    this.originalMessage = originalMessage;
    this.id = requestData.id;
    this.method = requestData.method;
    this.params = requestData.params;
}

Request.prototype.getAuditText = function () {
    return "id = "+this.id+", req = "+this.method+"("+this.params+")"
};

module.exports = Request;