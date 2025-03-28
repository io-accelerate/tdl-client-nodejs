"use strict";

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

module.exports = ValidResponse;
