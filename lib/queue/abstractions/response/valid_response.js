"use strict";

var Util = require("../../../util.js");

function ValidResponse(id, result) {
  this.id = id;
  this.result = result;
}

ValidResponse.prototype.asHash = function() {
  return {
    result: this.result,
    error: null,
    id: this.id
  };
};

ValidResponse.prototype.getAuditText = function() {
  return "resp = " + Util.compressData(this.result);
};

module.exports = ValidResponse;
