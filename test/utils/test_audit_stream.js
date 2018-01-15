'use strict';

function TestAuditStream() {
    this._log = '';
}

TestAuditStream.prototype.getLog = function() {
    return this._log;
}

TestAuditStream.prototype.log = function(value) {
    this._log += `${value}\n`;
}

module.exports = new TestAuditStream();
