'use strict';

const WiremockProcess = require('../utils/wiremock_process');
const util = require('util');

module.exports = function() {

    this.Given(/^There is a challenge server running on "(.*)" port (.*)$/, function(hostname, port, callback) {
        var world = this;

        world.challengeHostname = hostname;
        world.challengePort = port;
        
        world.challengeServerStub = new WiremockProcess(hostname, port);
        world.challengeServerStub
            .reset()
            .then(() => callback());
    });

    this.Given(/^There is a recording server running on "(.*)" port (.*)$/, function(hostname, port, callback) {
        var world = this;

        world.recordingServerStub = new WiremockProcess(hostname, port);
        world.recordingServerStub
            .reset()
            .then(() => callback());
    });

    this.Given(/^the challenge server exposes the following endpoints$/, function(table, callback) {
        var world = this;
        
        table.hashes()
            .reduce(function(prev, param) {
                return prev.then(function() {
                    return world.challengeServerStub.createNewMapping(param);
                });
            }, Promise.resolve())
            .then(() => callback());
    });

    this.Given(/^the recording server exposes the following endpoints$/, function(table, callback) {
        var world = this;
        
        table.hashes()
            .reduce(function(prev, param) {
                return prev.then(function() {
                    return world.recordingServerStub.createNewMapping(param);
                });
            }, Promise.resolve())
            .then(() => callback());
    });

    this.Given(/^journeyId is "(.*)"$/, function(journeyId, callback) {
        var world = this;

        world.journeyId = journeyId;

        callback();
    });

    this.Given(/^recording server is returning error$/, function(callback) {
        var world = this;

        world.recordingServerStub
            .reset()
            .then(() => callback());
    });

    this.Given(/^the challenge server returns (.*), response body ""(.*)"" for all requests$/, function(returnCode, body, callback) {
        var world = this;

        world.challengeServerStub
            .createNewMapping({
                endpointMatches: '^(.*)',
                status: returnCode,
                verb: 'ANY',
                responseBody: body
            })
            .then(() => callback());
    });

    this.Given(/^the challenge server returns (.*) for all requests$/, function(returnCode, callback) {
        var world = this;

        world.challengeServerStub
            .createNewMapping({
                endpointMatches: '^(.*)',
                status: returnCode,
                verb: 'ANY'
            })
            .then(() => callback());
    });
}
