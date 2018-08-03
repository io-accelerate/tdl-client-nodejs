'use strict';

var ChallengeServerClient = require('../runner/challenge_server_client');
var RecordingSystem = require('../runner/recording_system');
var RoundManagement = require('./round_management');

function ChallengeSession(implementationRunner) {
    this._implementationRunner = implementationRunner;
}

ChallengeSession.forRunner = function (implementationRunner) {
    return new ChallengeSession(implementationRunner);
};

ChallengeSession.prototype.withConfig = function (config) {
    this._config = config;
    this._auditStream = config.getAuditStream();
    this._roundManagement = new RoundManagement(config.getWorkingDirectory());
    return this;
};

ChallengeSession.prototype.withActionProvider = function (actionProvider) {
    this._actionProvider = actionProvider;
    return this;
};

/**
 * The entry point.
 */
ChallengeSession.prototype.start = function () {
    var self = this;

    self._recordingSystem = new RecordingSystem(self._config.getRecordingSystemShouldBeOn());

    return self._recordingSystem.isRecordingSystemOk()
        .then(function (isRecordingSystemOk) {
            if (!isRecordingSystemOk) {
                self._auditStream.log('Please run `record_screen_and_upload` before continuing.');
                return;
            }

            self._auditStream.log("Connecting to " + self._config.getHostname());
            return self._runApp();
        })
        .catch(function (error) {
            switch (error.name) {
                case 'ServerErrorException':
                    self._auditStream.log('Server experienced an error. Try again in a few minutes.');
                    break;
                case 'OtherCommunicationException':
                    self._auditStream.log('Client threw an unexpected error. Try again.');
                    break;
                case 'ClientErrorException':
                    // The client sent something the server didn't expect.
                    self._auditStream.log(error.message);
                    break;
            }
        });
};

ChallengeSession.prototype._runApp = function() {
    var self = this;
    
    self._challengeServerClient = new ChallengeServerClient(
        self._config.getHostname(),
        self._config.getPort(),
        self._config.getJourneyId(),
        self._config.getUseColours());

    return self._challengeServerClient.getJourneyProgress()
        .then(function(journeyProgress) {
            self._auditStream.log(journeyProgress);
            return self._challengeServerClient.getAvailableActions();
        })
        .then(function(availableActions) {
            self._auditStream.log(availableActions);
            return availableActions.indexOf('No actions available.') >= 0;
        })
        .then(function(noActionsAvailable) {
            if (noActionsAvailable) {
                return self._recordingSystem.tellToStop();
            } else {
                return self._continueChain();
            }
        });
};

ChallengeSession.prototype._continueChain = function() {
    var self = this;

    return self._actionProvider.get()
        .then(function(userInput) {
            self._auditStream.log("Selected action is: "+userInput);
            return userInput;
        })
        .then(function(userInput) {
            if (userInput === 'deploy') {
                var lastFetchedRound = self._roundManagement.getLastFetchedRound();
                return self._implementationRunner.run()
                    .then(function() {
                        return self._recordingSystem.notifyEvent(lastFetchedRound, RecordingSystem.event.ROUND_SOLUTION_DEPLOY)
                    })
                    .then(function () {
                        return userInput
                    });
            } else {
                return userInput
            }
        })
        .then(function(userInput) {
            return self._challengeServerClient.sendAction(userInput)
        })
        .then(function(actionFeedback) {
            if (actionFeedback.indexOf('Round time for') >= 0) {
                var lastFetchedRound = self._roundManagement.getLastFetchedRound();
                return self._recordingSystem.notifyEvent(lastFetchedRound, RecordingSystem.event.ROUND_COMPLETED)
                    .then(function () {
                        return actionFeedback
                    });
            } else {
                return actionFeedback;
            }
        })
        .then(function(actionFeedback) {
            if (actionFeedback.indexOf('All challenges have been completed') >= 0) {
                return self._recordingSystem.tellToStop()
                    .then(function () {
                        return actionFeedback
                    });
            } else {
                return actionFeedback;
            }
        })
        .then(function(actionFeedback) {
            self._auditStream.log(actionFeedback);
            return actionFeedback;
        })
        .then(function() {
            return self._challengeServerClient.getRoundDescription();
        })
        .then(function(roundDescription) {
            return self._roundManagement.saveDescription(self._recordingSystem, roundDescription, self._auditStream);
        });
};


module.exports = ChallengeSession;
