'use strict';

var Stompit = require('stompit');
var Promise = require('promise');

function RemoteBroker(uniqueId){
    this.uniqueId = uniqueId;
}


RemoteBroker.prototype.connect = function (hostname, port) {
    return new Promise(function (fulfill, reject) {
        var connectionManager = new Stompit.ConnectFailover([{
            host: hostname,
            port: port
        }]);
        connectionManager.on('error', function (error) {
            var connectArgs = error.connectArgs;
            var address = connectArgs.host + ':' + connectArgs.port;
            reject(new Error('Could not connect to ' + address + ': ' + error.message));
        });
        connectionManager.on('connecting', function (connector) {
            console.log('Connecting to ' + connector.serverProperties.remoteAddress.transportPath);
        });

        var channelPool = Stompit.ChannelPool(connectionManager);

        channelPool.channel(function (error, channel) {
            if (error) {
                reject(new Error("Connect error" + error.message));
            } else {
                fulfill(channel)
            }
        })
    });
};

RemoteBroker.prototype.subscribe = function (channel, handlingStrategy) {

};

module.exports = RemoteBroker;