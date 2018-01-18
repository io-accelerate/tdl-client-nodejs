'use strict';

var StopAction = require('../../actions/stop_action');

function FatalErrorResponse(message){
    this.message = message;
    this.clientAction = new StopAction(); 
}

FatalErrorResponse.prototype.getAuditText = function () {
    return "error = " + this.message;
};

module.exports = FatalErrorResponse;
