'use strict';

var Util = require("../../util.js");

function Request(originalMessage, requestData){
    this.originalMessage = originalMessage;
    this.id = requestData.id;
    this.method = requestData.method;
    this.params = requestData.params;
}

Request.prototype.getAuditText = function () {
    var parametersAsString = this.params.map(function (param) {
        return Util.compressData(param);
    }).join(", ");
    return "id = "+this.id+", req = "+this.method+"("+ parametersAsString+")"
};

module.exports = Request;
