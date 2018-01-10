'use strict';

var TDL = require('tdl-client');
var publish = TDL.ClientActions.publish;
var Promise = require('promise');
var Readline = require('readline');

var RunnerActions = require('./runner_actions');
var RecordingSystem = require('./recording_system');
var RoundManagement = require('./round_management');
var readFromConfigFileWithDefault = require('./credentials_config_file').readFromConfigFileWithDefault;
var readFromConfigFile = require('./credentials_config_file').readFromConfigFile;
var isTrue = require('./credentials_config_file').isTrue;
var ChallengeServerClient = require('./challenge_server_client');

//~~~~~~~~ The entry point ~~~~~~~~~

function ifUseExperimentalFeature(positiveCallback, negativeCallback) {
    isTrue(readFromConfigFileWithDefault("tdl_enable_experimental", "false")) ? positiveCallback() : negativeCallback();
}

function startClient(args, options) {
    RecordingSystem.ifRecordingSystemOk(
        function () {
            ifUseExperimentalFeature(function () {
                executeServerActionFromUserInput(args, options);
            }, function () {
                executeRunnerActionFromArgs(args, options);
            })
        },
        function () {
            console.log("Please run `record_screen_and_upload` before continuing.");
        }
    );
}

//~~~~~~~~ Runner Actions ~~~~~~~~~

function executeRunnerActionFromArgs(args, options) {
    console.log("Connecting to " + options.hostname);

    var valueFromArgs = extractActionFrom(args);
    var runnerAction = valueFromArgs === undefined ? options.actionIfNoArgs : valueFromArgs;
    executeRunnerAction(runnerAction, options);
}

function executeRunnerAction(runnerAction, options) {
    console.log("Chosen action is: %s", runnerAction.name);

    var client = new TDL.Client({hostname: options.hostname, uniqueId: options.username, requestTimeoutMillis: 1000});

    var rules = new TDL.ProcessingRules();
    rules.on('display_description')
        .call(RoundManagement.doSaveDescription)
        .then(publish());

    Object.keys(options.solutions).forEach(function (key) {
        rules.on(key)
            .call(options.solutions[key])
            .then(runnerAction.clientAction);
    });

    return client.goLiveWith(rules)
        .then(function () {
            RecordingSystem.notifyEvent(RoundManagement.getLastFetchedRound(), runnerAction.shortName);
        });
}

function extractActionFrom(args) {
    var firstArg = args.length > 0 ? args[0] : "";

    return RunnerActions.all.filter(function (action) {
        return action.name.toLowerCase() === firstArg.toLowerCase();
    }).shift()
}

//~~~~~~~~ Server Actions ~~~~~~~~~

function executeServerActionFromUserInput(args, options) {
    var journeyId = readFromConfigFile("tdl_journey_id");
    var useColours = isTrue(readFromConfigFile("tdl_use_coloured_output", "true"));
    var challengeServerClient = new ChallengeServerClient(options.hostname, journeyId, useColours);

    identityPromise()
        .then(function () {
            return challengeServerClient.getJourneyProgress()
        })
        .then(printOut)
        .then(function () {
            return challengeServerClient.getAvailableActions();
        })
        .then(printOut)
        .then(function (availableActions) {
            if (availableActions.indexOf("No actions available.") > -1) {
                return Promise.reject();
            }
        })
        .then(function () {
            return getUserInput(args);
        })
        .then(function (userInput) {
            if (userInput === "deploy") {
                return executeRunnerAction(RunnerActions.deployToProduction, options)
                    .then( function () {
                        return Promise.resolve(userInput);
                    });
            } else {
                return Promise.resolve(userInput);
            }
        })
        .then(function (userInput) {
            return challengeServerClient.sendAction(userInput);
        })
        .then(printOut)
        .then(function () {
            return challengeServerClient.getRoundDescription();
        })
        .then(function (roundDescription) {
            RoundManagement.saveDescription(roundDescription, function(newRoundId) {
                RecordingSystem.notifyEvent(newRoundId, RunnerActions.getNewRoundDescription.shortName);
            })
        })
        .catch(function (err) {
            if (err.name === "ServerErrorException") {
                console.log("Server experienced an error. Try again.")
            } else
            if (err.name === "OtherCommunicationException") {
                console.log("Client threw an unexpected error.")
            } else
            if (err.name === "ClientErrorException") {
                console.log("The client sent something the server didn't expect.")
            }

            if(err.message) console.log(err.message)
        });
}

//~~~~ Utils

function identityPromise() {
    return Promise.resolve();
}

function printOut(value) {
    if (value) console.log(value);
    return Promise.resolve(value)
}

function getUserInput(args) {
    return args.length > 0 ? Promise.resolve(args[0]) : readFromConsole();
}

function readFromConsole() {
    return new Promise(function (fulfill) {
        var consoleIn = Readline.createInterface({
            input: process.stdin
        });
        consoleIn.question('', function(answer) {
            fulfill(answer);
            consoleIn.close();
            process.stdin.destroy();
        });
    })
}


module.exports = startClient;
