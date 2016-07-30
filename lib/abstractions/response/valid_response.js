'use strict';

function ValidResponse(id, result, clientAction){
    this.id = id;
    this.result = result;
    this.clientAction = clientAction;
}

ValidResponse.prototype.asHash = function () {
    return {
        result: this.result,
        error: null,
        id: this.id
    };
};

ValidResponse.prototype.getAuditText = function () {
    return "resp = " + this.result;
};

module.exports = ValidResponse;
