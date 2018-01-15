'use strict';

const ChallengeServerClient = require('../runner/challenge_server_client');
const RecordingSystem = require('../runner/recording_system');
const RoundManagement = require('./round_management');

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

    self._recordingSystem = new RecordingSystem(self._config.recordingSystemShouldBeOn);

    var auditStream = self._config.getAuditStream();

    return self._recordingSystem.isRunning().then(function(isRunning) {
        if (!isRunning) {
            auditStream.log('Please run `record_screen_and_upload` before continuing.');
            return;
        }

        auditStream.log(`Connection to ${self._config.getHostname()}`);
        return self._runApp();
    });
}

ChallengeSession.prototype._runApp = function() {
    var self = this;

    var auditStream = self._config.getAuditStream();
    
    return new Promise(function(resolve) {
        self._challengeServerClient = new ChallengeServerClient(
                self._config.getHostname(),
                self._config.getPort(),
                self._config.getJourneyId(),
                self._config.getUseColours());

        self._checkStatusOfChallenge()
            .then(function(shouldContinue) {
                if (!shouldContinue) {
                    resolve();
                }

                return self._actionProvider.get();
            })
            .then(function(userInput) {
                auditStream.log(`Selected action is: ${userInput}`);
                return self._executeUserAction(userInput);
            })
            .then(function(roundDescription) {
                return RoundManagement.saveDescription(self._recordingSystem, roundDescription);
            })
            .then(() => resolve());
    });
};

ChallengeSession.prototype._checkStatusOfChallenge = function() {
    var self = this;

    var auditStream = self._config.getAuditStream();

    return new Promise(function(resolve) {
        self._challengeServerClient.getJourneyProgress()
            .then(function(journeyProgress) {
                auditStream.log(journeyProgress);
                return self._challengeServerClient.getAvailableActions();
            })
            .then(function(availableActions) {
                auditStream.log(availableActions);
                resolve(availableActions.indexOf('No actions available.') === -1);
            });
    });
};

ChallengeSession.prototype._executeUserAction = function(userInput) {
    var self = this;

    if (userInput !== 'deploy') {
        return self._executeAction(userInput);
    }

    return self._implementationRunner.run()
        .then(function() {
            var lastFetchedRound = RoundManagement.getLastFetchedRound();
            return self._recordingSystem.deployNotifyEvent(lastFetchedRound);
        })
        .then(function() {
            return self._executeAction(userInput);
        });
};

ChallengeSession.prototype._executeAction = function(userInput) {
    var self = this;

    var auditStream = self._config.getAuditStream();

    return new Promise(function(resolve) {
        self._challengeServerClient.sendAction(userInput)
            .then(function(actionFeedback) {
                auditStream.log(actionFeedback);
                return self._challengeServerClient.getRoundDescription();
            })
            .then((roundDescription) => resolve(roundDescription));
    });
};

module.exports = ChallengeSession;
