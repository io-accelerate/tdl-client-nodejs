'use strict';

const RecordingSystem = require('../runner/recording_system');

function ChallengeSession(implementationRunner) {
    this._implementationRunner = implementationRunner;
}

ChallengeSession.forRunner = function(implementationRunner) {
    return new ChallengeSession(implementationRunner);
}

ChallengeSession.prototype.withConfig = function(config) {
    this._config = config;
    return this;
}

ChallengeSession.prototype.withActionProvider = function(actionProvider) {
    this._actionProvider = actionProvider;
    return this;
}

/**
 * The entry point.
 */
ChallengeSession.prototype.start = function() {
    var self = this;

    self._recordintSystem = new RecordingSystem(self._config.recordingSystemShouldBeOn);

    return self._recordintSystem.isRunning().then(function(isRunning) {
        if (!isRunning) {
            console.log('Please run `record_screen_and_upload` before continuing.');
            return;
        }

        console.log(`Connection to ${self._config.getHostname()}`);
        return self._runApp();
    });
}

ChallengeSession.prototype._runApp = function() {
    return new Promise(function(resolve) {
        resolve();
    });
};

module.exports = ChallengeSession;
