'use strict';

var path = require('path');
var fs = require('fs');

function RoundManagement(workingDirectory) {
    var workingDirectoryPath = path.resolve(workingDirectory);
    this._challengesPath = path.join(workingDirectoryPath, 'challenges');
    this._lastFetchedRoundPath = path.join(this._challengesPath, 'XR.txt');
}

RoundManagement.prototype.saveDescription = function(listener, rawDescription, auditStream) {
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
                    self.doSaveDescription(roundId, rawDescription, auditStream);
                    resolve();
                });
        }
        else {
            self.doSaveDescription(roundId, rawDescription, auditStream);
            resolve();
        }     
    });
};

RoundManagement.prototype.doSaveDescription = function(label, description, auditStream) {
    var filePath = path.join(this._challengesPath, label+".txt");
    this.ensureDirectoryExists(filePath);
    fs.writeFileSync(filePath, description);
    auditStream.log("Challenge description saved to file: challenges/"+label+".txt.");

    fs.writeFileSync(this._lastFetchedRoundPath, label);
    return 'OK'
};

RoundManagement.prototype.getLastFetchedRound = function () {
    try {
        return fs.readFileSync(this._lastFetchedRoundPath, 'utf8');
    } catch (ex) {
        return "noRound";
    }
};

RoundManagement.prototype.ensureDirectoryExists = function(filePath) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
        return;
    }

    this.ensureDirectoryExists(dirname);
    fs.mkdirSync(dirname);
};

module.exports = RoundManagement;
