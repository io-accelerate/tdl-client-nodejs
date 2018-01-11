'use strict';

const CHALLENGES_FOLDER = require('path').resolve(__dirname, '../../challenges');
const LAST_FETCHED_ROUND_PATH = CHALLENGES_FOLDER + "/" + "XR.txt";

var fs = require('fs');

module.exports.saveDescription = function(listener, rawDescription) {
    var self = this;
    
    return new Promise(function(resolve) {
        var newlineIndex = rawDescription.indexOf("\n");
        if (newlineIndex <= 0) {
            resolve();
        }

        var roundId = rawDescription.substring(0, newlineIndex);
        var lastFetchedRound = self.getLastFetchedRound();
        if (roundId !== lastFetchedRound) {
            listener.onNewRound(roundId, 'new')
                .then(function() {
                    this.doSaveDescription(roundId, rawDescription);
                    resolve();
                });
        }

        this.doSaveDescription(roundId, rawDescription);
        resolve();
    });
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