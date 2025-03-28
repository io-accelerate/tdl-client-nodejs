'use strict';

const PresentationUtils = require("./presentation_utils");
const stringIsEmpty = function (value) {
    return typeof value == 'string' && !value.trim() || typeof value == 'undefined' || value === null;
};

function AuditStream() {
    this.str = '';
    this.startLine();
}

AuditStream.prototype.startLine = function () {
    this.str = '';
};

AuditStream.prototype.log_request = function (request) {
    let parametersAsString = PresentationUtils.to_displayable_request(request.params);
    let text = "id = " + request.id + ", req = " + request.method + "(" + parametersAsString + ")";

    if (!stringIsEmpty(text) && this.str.length > 0) {
        this.str += ", "
    }
    this.str += text;
};

AuditStream.prototype.log_response = function (response) {
    // Check if response has the "result" property
    let text;
    if (response.hasOwnProperty("result")) {
        text = "resp = " + PresentationUtils.to_displayable_response(response.result);
    } else {
        text = "error = " + response.message + ", (NOT PUBLISHED)";
    }
    if (!stringIsEmpty(text) && this.str.length > 0) {
        this.str += ", "
    }
    this.str += text;
};

AuditStream.prototype.endLine = function () {
    console.log(this.str)
};

module.exports = AuditStream;
