'use strict';

function FatalErrorResponse(message){
    this.message = message;
    this.clientAction = "XNO action";
}

FatalErrorResponse.prototype.getAuditText = function () {
    return "error = " + this.message;
};

module.exports = FatalErrorResponse;
