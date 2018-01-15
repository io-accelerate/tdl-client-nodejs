'use strict';

function NoisyImplementationRunner(deployMessage, auditStream) {
    this._deployMessage = deployMessage;
    this._auditStream = auditStream;
}

NoisyImplementationRunner.prototype.run = function() {
    var self = this;
    return new Promise(function(resolve) {
        self._auditStream.log(self._deployMessage);
        resolve();
    });
}

module.exports = NoisyImplementationRunner;
