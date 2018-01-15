'use strict';

function ConsoleAuditStream () {
    
}

ConsoleAuditStream.prototype.log = function(value) {
    console.log(value);
}

module.exports = ConsoleAuditStream;
