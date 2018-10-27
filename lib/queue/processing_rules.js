"use strict";

var ValidResponse = require("./abstractions/response/valid_response");
var FatalErrorResponse = require("./abstractions/response/fatal_error_response");

function ProcessingRules() {
  this.rules = {};
}

// ~~~~ Builders

ProcessingRules.prototype.add = function(methodName, userImplementation) {
  this.rules[methodName] = { userImplementation: userImplementation };
};

ProcessingRules.prototype.on = function(methodName) {
  return new Builder(this, methodName);
};
var Builder = function(instance, methodName) {
  this.instance = instance;
  this.methodName = methodName;
  return this;
};
Builder.prototype.call = function(userImplementation) {
  this.userImplementation = userImplementation;
  return this;
};

Builder.prototype.then = function() {
  this.instance.add(this.methodName, this.userImplementation);
};

// ~~~~ Accessors

ProcessingRules.prototype.getResponseFor = function(request) {
  var processingRule;
  if (request.method in this.rules) {
    processingRule = this.rules[request.method];
  } else {
    const message =
      "\"method '" + request.method + "' did not match any processing rule\"";
    console.warn(message);
    return new FatalErrorResponse(message);
  }

  try {
    var userImplementation = processingRule.userImplementation;
    var result = userImplementation.apply(null, request.params);

    return new ValidResponse(request.id, result);
  } catch (error) {
    const message = '"user implementation raised exception"';
    console.warn(message + ", " + error.message);
    console.warn(error.stack);
    return new FatalErrorResponse(message);
  }
};

module.exports = ProcessingRules;
