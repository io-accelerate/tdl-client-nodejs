'use strict';

const unirest = require('unirest');
const RECORDING_SYSTEM_ENDPOINT = 'http://localhost:41375';

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
                if (response.error) {
                    console.log(`Could not reach recording system: ${response.error}`);
                    resolve(false);
                }

                if (response.code === 200 && startsWith('OK',response.body)) {
                    resolve(true);
                }

                resolve(false);
            });
    });
};

module.exports = RecordingSystem;
