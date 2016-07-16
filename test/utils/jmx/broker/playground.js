'use strict';

//Useful for debugging
var util = require('util');
function inspect(result) {
    return util.inspect(result, {showHidden: false, depth: null});
}

var JolokiaSession = require('./jolokia_session.js');


var onResponseCallback = function (jolokiaSession) {
    inspect(jolokiaSession);
    console.log("jolokiaSession = ", jolokiaSession);
};
JolokiaSession.connect('localhost', 28161, onResponseCallback);

//
// // Add queue
// var operation = {
//     type: 'exec',
//     mbean: 'org.apache.activemq:type=Broker,brokerName=TEST.BROKER',
//     operation: 'addQueue',
//     arguments: ['test.req']
// };
//
// jolokia_session.request(operation);
// // Send message
// operation = {
//     type: 'exec',
//     mbean: 'org.apache.activemq:type=Broker,brokerName=TEST.BROKER,destinationType=Queue,destinationName=test.req',
//     operation: 'sendTextMessage(java.lang.String)',
//     arguments: ['test message']
// };
//
// jolokia_session.request(operation);
// // Read queue size
// var attribute = {
//     type: 'read',
//     mbean: 'org.apache.activemq:type=Broker,brokerName=TEST.BROKER,destinationType=Queue,destinationName=test.req',
//     attribute: 'QueueSize'
// };
// var result = jolokia_session.request(attribute);
//
// console.log("Value = ",result);
// // Browse queues
// operation = {
//     type: 'exec',
//     mbean: 'org.apache.activemq:type=Broker,brokerName=TEST.BROKER,destinationType=Queue,destinationName=test.req',
//     operation: 'browse()'
// };
// result = jolokia_session.request(operation);
// console.log(inspect());
// // Iterate the results and log composite
// // puts result.map  { |composite_data|
// //
// //
// // composite_data['Text']
// // }
//
// // Purge
// operation = {
//     type: 'exec',
//     mbean: 'org.apache.activemq:type=Broker,brokerName=TEST.BROKER,destinationType=Queue,destinationName=test.req',
//     operation: 'purge()'
// };
// jolokia_session.request(operation);
