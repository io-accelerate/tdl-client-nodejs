'use strict';

function QuietImplementationRunner() {

}

QuietImplementationRunner.prototype.run = function () {
    return new Promise(function (resolve) {
        // Do nothing.
        resolve();
    });
};

QuietImplementationRunner.prototype.setAuditStream = function (auditStream) {

};

module.exports = QuietImplementationRunner;
