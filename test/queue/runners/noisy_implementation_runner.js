'use strict';

function NoisyImplementationRunner(deployMessage, auditStream) {
    this._deployMessage = deployMessage;
    this._auditStream = auditStream;
}

NoisyImplementationRunner.prototype.run = function() {
    return new Promise(function(resolve) {
        this._auditStream.log(this._deployMessage);
        resolve();
    });
}

module.exports = NoisyImplementationRunner;
