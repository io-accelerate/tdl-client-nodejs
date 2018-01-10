'use strict';

var WiremockProcess = require('../utils/wiremock_process');

module.exports = function() {

    this.Given(/^There is a challenge server running on "(.*)" port (.*)$/, function(hostname, port, callback) {
        var world = this;

        world.challengeHostname = hostname;
        world.challengePort = port;
        
        try {
            world.challengeServerStub = new WiremockProcess(hostname, port);
            world.challengeServerStub.reset().then(function() {callback()});    
        } catch (error) {
            console.log(error.message);
        }
    });

}
