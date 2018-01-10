'use strict';

var TDL = require('tdl-client');

module.exports.getNewRoundDescription = {
    shortName: "new",
    name: "getNewRoundDescription",
    clientAction: TDL.ClientActions.stop()
};
module.exports.testConnectivity = {
    shortName: "test",
    name: "testConnectivity",
    clientAction: TDL.ClientActions.stop()
};
module.exports.deployToProduction = {
    shortName: "deploy",
    name: "deployToProduction",
    clientAction: TDL.ClientActions.publish()
};

module.exports.all = [
    module.exports.getNewRoundDescription,
    module.exports.testConnectivity,
    module.exports.deployToProduction
];