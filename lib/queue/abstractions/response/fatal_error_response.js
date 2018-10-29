"use strict";

function FatalErrorResponse(message) {
  this.message = message + ", (NOT PUBLISHED)";
}

FatalErrorResponse.prototype.getAuditText = function() {
  return "error = " + this.message;
};

module.exports = FatalErrorResponse;
