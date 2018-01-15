'use strict';

var path = require('path');
var fs = require('fs');

const CHALLENGES_FOLDER = path.join(tdlAppRoot, 'challenges');
const LAST_FETCHED_ROUND_PATH = path.join(CHALLENGES_FOLDER, 'XR.txt');

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
                    self.doSaveDescription(roundId, rawDescription);
                    resolve();
                });
        }

        self.doSaveDescription(roundId, rawDescription);
        resolve();
    });
};

module.exports.doSaveDescription = function(label, description) {
    var filePath = path.join(CHALLENGES_FOLDER, `${label}.txt`);
    fs.writeFileSync(filePath, description);
    console.log(`Challenge description saved to file: ${filePath}.`);

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
