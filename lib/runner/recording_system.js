'use strict';

var unirest = require('unirest');
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
            return;
        }

        self.isRunning().then(function(isRunning) {
            resolve(isRunning);
        });
    });
};

RecordingSystem.prototype.isRunning = function() {
    return new Promise(function(resolve) {
        unirest
            .get(RECORDING_SYSTEM_ENDPOINT+"/status")
            .end(function (response) {
                if (response.code === 200 && startsWith('OK', response.body)) {
                    resolve(true);
                }

                if (response.error) {
                    console.log("Could not reach recording system: "+response.error);
                }

                resolve(false);
            });
    });
};

RecordingSystem.event = {
    ROUND_START: "new",
    ROUND_SOLUTION_DEPLOY: "deploy",
    ROUND_COMPLETED: "done"
};

RecordingSystem.prototype.onNewRound = function(roundId) {
    return this.notifyEvent(roundId, RecordingSystem.event.ROUND_START);

};

RecordingSystem.prototype.notifyEvent = function(lastFetchedRound, eventName) {
    console.log("Notify round "+lastFetchedRound+", event "+eventName);
    return this._sendPost("/notify", lastFetchedRound+"/"+eventName)
};

RecordingSystem.prototype.tellToStop = function() {
    console.log("Stopping recording system");
    return this._sendPost("/stop","")
};

RecordingSystem.prototype._sendPost = function(endpoint, body) {
    var self = this;
    return new Promise(function(resolve) {
        if (!self._recordingRequired) {
            resolve();

            return;
        }
        unirest
            .post(RECORDING_SYSTEM_ENDPOINT+ endpoint)
            .send(body)
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
