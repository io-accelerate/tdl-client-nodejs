'use strict';

const unirest = require('unirest');
const RunnerActions = require('./runner_actions');

const RECORDING_SYSTEM_ENDPOINT = 'http://localhost:41375';

// TODO: Move to separate helper file.
function startsWith (suffix, value) {
    return value && value.indexOf(suffix, 0) === 0;
}

function RecordingSystem(recordingRequired) {
    this._recordingRequired = recordingRequired;
}

RecordingSystem.prototype.isRecordingSystemOk = function() {
    var self = this;

    return new Promise(function(resolve) {
        if (!self._recordingRequired) {
            resolve(true);
        }

        self.isRunning().then(function(isRunning) {
            resolve(isRunning);
        });
    });
};

RecordingSystem.prototype.isRunning = function() {
    var self = this;

    return new Promise(function(resolve) {
        unirest
            .get(`${RECORDING_SYSTEM_ENDPOINT}/status`)
            .end(function (response) {
                if (response.code === 200 && startsWith('OK', response.body)) {
                    resolve(true);
                }

                if (response.error) {
                    console.log(`Could not reach recording system: ${response.error}`);
                }

                resolve(false);
            });
    });
};

RecordingSystem.prototype.onNewRound = function(roundId, shortName) {
    return this._notifyEvent(roundId, shortName);
};

RecordingSystem.prototype.deployNotifyEvent = function(lastFetchedRound) {
    return this._notifyEvent(lastFetchedRound, RunnerActions.deployToProduction.shortName);
};

RecordingSystem.prototype._notifyEvent = function(lastFetchedRound, actionName) {
    console.log(`Notify round "${lastFetchedRound}", event "${actionName}"`);
    var self = this;
    return new Promise(function(resolve) {
        if (!self._recordingRequired) {
            resolve();
        }

        unirest
            .post(`${RECORDING_SYSTEM_ENDPOINT}/notify`)
            .send(`${lastFetchedRound}/${actionName}`)
            .end(function(response) {
                if (response.error) {
                    console.log("Could not reach recording system: " + response.error);
                } else if (response.code !== 200) {
                    console.log("Recording system returned code: " + response.code);
                } if (response.body.indexOf('ACK') !== 0) {
                    console.log("Recording system returned body:" + response.body);
                }

                resolve();
            });
    });
};

module.exports = RecordingSystem;
