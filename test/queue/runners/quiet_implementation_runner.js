'use stric';

function QuietImplementationRunner() {

}

QuietImplementationRunner.prototype.run = function() {
    return new Promise(function(resolve) {
        // Do nothing.
        resolve();
    });
}

module.exports = QuietImplementationRunner;
