"use strict";

const assert = require('assert'); // Use Node.js built-in assert
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const { Given, When, Then } = require('@cucumber/cucumber');

const TDL = require('../..');
const WiremockProcess = require('./wiremock_process');
const TestActionProvider = require('./test_action_provider');
const TestAuditStream = require('./test_audit_stream');
const NoisyImplementationRunner = require('../queue/runners/noisy_implementation_runner');
const QuietImplementationRunner = require('../queue/runners/quiet_implementation_runner');

const workingDirectory = './';

Given(/^There is a challenge server running on "(.*)" port (.*)$/, function (hostname, port) {
    this.challengeHostname = hostname;
    this.challengePort = port;

    this.challengeServerStub = new WiremockProcess(hostname, port);
    return this.challengeServerStub.reset();
});

Given(/^There is a recording server running on "(.*)" port (.*)$/, function (hostname, port) {
    this.recordingServerStub = new WiremockProcess(hostname, port);
    return this.recordingServerStub.reset();
});

Given(/^the challenge server exposes the following endpoints$/, function (table) {
    const world = this;

    return table.hashes().reduce(function (prev, serverConfig) {
        return prev.then(function () {
            return world.challengeServerStub.createNewMapping(serverConfig);
        });
    }, Promise.resolve());
});

Given(/^the recording server exposes the following endpoints$/, function (table) {
    const world = this;

    return table.hashes().reduce(function (prev, serverConfig) {
        return prev.then(function () {
            return world.recordingServerStub.createNewMapping(serverConfig);
        });
    }, Promise.resolve());
});

Given(/^journeyId is "(.*)"$/, function (journeyId) {
    this.journeyId = journeyId;
});

Given(/^the action input comes from a provider returning "(.*)"$/, function (s) {
    TestActionProvider.set(s);
});

Given(/^the challenges folder is empty$/, function () {
    const challengesPath = path.join(workingDirectory, 'challenges');
    return new Promise((resolve, reject) => {
        rimraf(challengesPath, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
});

Given(/^there is an implementation runner that prints "(.*)"$/, function (s) {
    this.implementationRunnerMessage = s;
    this.implementationRunner = new NoisyImplementationRunner(s);
});

Given(/^recording server is returning error$/, function () {
    return this.recordingServerStub.reset();
});

Given(/^the challenge server returns (\d+), response body "(.*)" for all requests$/, function (returnCode, body) {
    return this.challengeServerStub.createNewMapping({
        endpointMatches: '^(.*)',
        status: returnCode,
        verb: 'ANY',
        responseBody: body
    });
});

Given(/^the challenge server returns (\d+) for all requests$/, function (returnCode) {
    return this.challengeServerStub.createNewMapping({
        endpointMatches: '^(.*)',
        status: returnCode,
        verb: 'ANY'
    });
});

When(/^user starts client$/, function () {
    const world = this;

    world.auditStream = new TestAuditStream();

    const config = TDL.ChallengeSessionConfig
        .forJourneyId(world.journeyId)
        .withServerHostname(world.challengeHostname)
        .withPort(world.challengePort)
        .withColours(true)
        .withAuditStream(world.auditStream)
        .withRecordingSystemShouldBeOn(true)
        .withWorkingDirectory(workingDirectory);

    const runner = world.implementationRunner || new QuietImplementationRunner();
    runner.setAuditStream(world.auditStream);

    return TDL.ChallengeSession
        .forRunner(runner)
        .withConfig(config)
        .withActionProvider(TestActionProvider)
        .start();
});

Then(/^the server interaction should look like:$/, function (expectedOutput) {
    const total = this.auditStream.getLog();
    assert.ok(total.includes(expectedOutput), 'Expected string is not contained in output');
});

Then(/^the file "(.*)" should contain$/, function (file, text) {
    const fileFullPath = path.join(workingDirectory, file);

    const fileContent = fs.readFileSync(fileFullPath, 'utf8');
    text = text.replace(/\n$/, '');

    assert.strictEqual(fileContent, text, 'Contents of the file is not what is expected');
});

Then(/^the recording system should be notified with "(.*)"$/, function (expectedOutput) {
    return this.recordingServerStub.verifyEndpointWasHit('/notify', 'POST', expectedOutput).then(function (wasHit) {
        assert.ok(wasHit);
    });
});

Then(/^the recording system should have received a stop signal$/, function () {
    return this.recordingServerStub.verifyEndpointWasHit('/stop', 'POST', "").then(function (wasHit) {
        assert.ok(wasHit);
    });
});

Then(/^the implementation runner should be run with the provided implementations$/, function () {
    const total = this.auditStream.getLog();
    assert.ok(total.includes(this.implementationRunnerMessage));
});

Then(/^the server interaction should contain the following lines:$/, function (expectedOutput) {
    const total = this.auditStream.getLog();
    const lines = expectedOutput.split('\n');
    lines.forEach(function (line) {
        assert.ok(total.includes(line), 'Expected string is not contained in output');
    });
});

Then(/^the client should not ask the user for input$/, function () {
    const total = this.auditStream.getLog();
    assert.ok(!total.includes('Selected action is:'));
});
