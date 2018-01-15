'use strict';

function NoisyImplementationRunner(deployMessage) {
    this._deployMessage = deployMessage;
}

NoisyImplementationRunner.prototype.run = function() {
    var self = this;
    return new Promise(function(resolve) {
        self._auditStream.log(self._deployMessage);
        resolve();
    });
}

NoisyImplementationRunner.prototype.setAuditStream = function(auditStream) {
    this._auditStream = auditStream;
}

module.exports = NoisyImplementationRunner;
