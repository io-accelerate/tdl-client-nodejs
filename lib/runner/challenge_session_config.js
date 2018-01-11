'use strict';

function ChallengeSessionConfig(journeyId) {
    this._port = 8222;
    this._useColours = true;
    this._recordingSystemShouldBeOn = true;
    this._journeyId = journeyId;
    // TODO: this._auditStream = new ConsoleAuditStream();
}

ChallengeSessionConfig.forJourneyId = function(journeyId) {
    return new ChallengeSessionConfig(journeyId);
};

ChallengeSessionConfig.prototype.withServerHostname = function(hostname) {
    this._hostname = hostname;
    return this;
};

ChallengeSessionConfig.prototype.withPort = function(port) {
    this._port = port;
    return this;
};

ChallengeSessionConfig.prototype.withColours = function(useColours) {
    this._useColours = useColours;
    return this;
};

ChallengeSessionConfig.prototype.withAuditStream = function(auditStream) {
    this._auditStream = auditStream;
    return this;
};

ChallengeSessionConfig.prototype.withRecordingSystemShouldBeOn = function(recordingSystemShouldBeOn) {
    this._recordingSystemShouldBeOn = recordingSystemShouldBeOn;
    return this;
};

ChallengeSessionConfig.prototype.getHostname = function() {
    return this._hostname;
};

ChallengeSessionConfig.prototype.getPort = function() {
    return this._port;
};

ChallengeSessionConfig.prototype.getJourneyId = function() {
    return this._journeyId;
};

ChallengeSessionConfig.prototype.getUseColours = function() {
    return this._useColours;
};

module.exports = ChallengeSessionConfig;
