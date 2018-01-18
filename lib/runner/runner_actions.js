'use strict';

var clientActions = require('../queue/actions/client_actions');

module.exports.getNewRoundDescription = {
    shortName: "new",
    name: "getNewRoundDescription",
    clientAction: clientActions.stop()
};

module.exports.deployToProduction = {
    shortName: "deploy",
    name: "deployToProduction",
    clientAction: clientActions.publish()
};

module.exports.all = [
    module.exports.getNewRoundDescription,
    module.exports.deployToProduction
];
