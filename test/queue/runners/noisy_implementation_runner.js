'use strict';

function NoisyImplementationRunner(deployMessage, auditStream) {
    this._deployMessage = deployMessage;
    this._auditStream = auditStream;
}

NoisyImplementationRunner.prototype.run = function() {
    this._auditStream.log(this._deployMessage);
}

module.exports = NoisyImplementationRunner;
