'use strict';

var unirest = require('unirest');
var readFromConfigFileWithDefault = require('./credentials_config_file').readFromConfigFileWithDefault;
var isTrue = require('./credentials_config_file').isTrue;


const RECORDING_SYSTEM_ENDPOINT = "http://localhost:41375";

function startsWith(suffix, value) {
    if (!value) return false;
    return value.indexOf(suffix, 0) === 0;
}

module.exports.ifRecordingSystemOk = function (positiveCallback, negativeCallback) {
    var requireRecording = isTrue(readFromConfigFileWithDefault("tdl_require_rec", "true"));

    //noinspection SimplifiableIfStatement,RedundantIfStatementJS
    if (requireRecording) {
        return ifRunning(positiveCallback, negativeCallback);
    } else {
        return positiveCallback();
    }
};

function ifRunning(callback, errorCallback) {
    // noinspection JSUnresolvedFunction
    unirest
        .get(RECORDING_SYSTEM_ENDPOINT+'/status')
        .end(function (response) {
            if (response.error) {
                console.log("Could not reach recording system: " + response.error);
                errorCallback( );
                return
            }

            if (response.code === 200 && startsWith("OK",response.body)) {
                callback();
                return
            }

            errorCallback()
        });
}

module.exports.notifyEvent = function (lastFetchedRound, shortName) {
    var requireRecording = isTrue(readFromConfigFileWithDefault("tdl_require_rec", "true"));
    if (!requireRecording) {
        return
    }

    console.log("Notify round \""+lastFetchedRound+"\", event \""+shortName+"\"");
    unirest
        .post(RECORDING_SYSTEM_ENDPOINT+'/notify')
        .send(lastFetchedRound + '/' + shortName)
        .end(function (response) {
            if (response.error) {
                console.log("Could not reach recording system: " + response.error);
                return;
            }

            if (response.code !== 200) {
                console.log("Recording system returned code: " + response.code);
                return;
            }

            if (!response.body.startsWith("ACK")) {
                console.log("Recording system returned body:" + response.body);
            }
        })
};
