'use strict';

function ProcessingRules(){
    this.rules = {}
}

// ~~~~ Builders

ProcessingRules.prototype.add = function (methodName, userImplementation, clientAction) {
    this.rules[methodName] = {userImplementation: userImplementation, clientAction: clientAction}
};

ProcessingRules.prototype.on = function (methodName) {
    return new Builder(this, methodName);
};
var Builder = function(instance, methodName) {
    this.instance = instance;
    this.methodName = methodName;
    return this;
};
Builder.prototype.call = function (userImplementation) {
    this.userImplementation = userImplementation;
    return this;
};

Builder.prototype.then = function (clientAction) {
    this.instance.add(this.methodName, this.userImplementation, clientAction)
};

// ~~~~ Accessors

ProcessingRules.prototype.getResponseFor = function (request) {
    var processingRule = this.rules[request.method];
    return {id: request.id, result: "x", clientAction: processingRule.clientAction}
};

module.exports = ProcessingRules;