'use strict';

const CHALLENGES_FOLDER = require('path').resolve(__dirname, '../../challenges');
const LAST_FETCHED_ROUND_PATH = CHALLENGES_FOLDER + "/" + "XR.txt";

var fs = require('fs');

module.exports.saveDescription = function(rawDescription, callbackOnChange) {
    if (!rawDescription) return;

    var newlineIndex = rawDescription.indexOf("\n");
    if (newlineIndex <= 0) return;

    var roundId = rawDescription.substring(0, newlineIndex);
    var lastFetchedRound = this.getLastFetchedRound();
    if (roundId !== lastFetchedRound) {
        callbackOnChange(roundId);
    }
    this.doSaveDescription(roundId, rawDescription);
};


module.exports.doSaveDescription = function(label, description) {
    fs.writeFileSync(CHALLENGES_FOLDER + "/" + label + ".txt", description);
    console.log("Challenge description saved to file: " + "challenges" + "/" + label + ".txt" + ".");

    fs.writeFileSync(LAST_FETCHED_ROUND_PATH, label);
    return 'OK'
};

module.exports.getLastFetchedRound = function () {
    try {
        return fs.readFileSync(LAST_FETCHED_ROUND_PATH, 'utf8');
    } catch (ex) {
        return "noRound"
    }
};