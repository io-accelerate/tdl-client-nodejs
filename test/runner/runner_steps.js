'use strict';

const WiremockProcess = require('../utils/wiremock_process');
const util = require('util');
const ChallengeSessionConfig = require('../../lib/runner/challenge_session_config');
const ChallengeSesstion = require('../../lib/runner/challenge_session');

const TestActionProvider = require('./test_action_provider');

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

    this.Given(/^the action input comes from a provider returning "(.*)"$/, function(s, callback) {
        TestActionProvider.set(s);
        callback();
    });

    this.Given(/^the challenges folder is empty$/, function(callback) {
        callback();
    });

    this.Given(/^there is an implementation runner that prints "(.*)"$/, function(s, callback) {
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

    this.When(/^user starts client$/, function(callback) {
        var world = this;
        try {
            var config = ChallengeSessionConfig
            .forJourneyId(world.journeyId)
            .withServerHostname(world.challengeHostname)
            .withPort(world.challengePort)
            .withColours(true)
            //.withAuditStream(world.auditStream)
            .withRecordingSystemShouldBeOn(true);
        
        ChallengeSesstion
            .forRunner(world.implementationRunner)
            .withConfig(config)
            .withActionProvider(TestActionProvider)
            .start()
            .then(() => callback());
        } catch (error) {
            console.log(error.message);
        }
        
    });

    this.Then(/^the server interaction should look like:$/, function(expectedOutput, callback) {
        callback();
    });

    this.Then(/^the file "(.*)" should contain$/, function(file, text, callback) {
        callback();
    });

    this.Then(/^the recording system should be notified with "(.*)"$/, function(expectedOutput, callback) {
        callback();
    });

    this.Then(/^the implementation runner should be run with the provided implementations$/, function(callback) {
        callback();
    });

    this.Then(/^the server interaction should contain the following lines:$/, function(expectedOutput, callback) {
        callback();
    });

    this.Then(/^the client should not ask the user for input$/, function(callback) {
        callback();
    });
}
