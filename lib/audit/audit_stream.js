'use strict';

var stringIsEmpty = require("../util").stringIsEmpty;

function AuditStream() {
    this.str = '';
    this.startLine();
}

AuditStream.prototype.startLine = function () {
    this.str = '';
};

AuditStream.prototype.log = function (auditable) {
    var text = auditable.getAuditText();
    if (!stringIsEmpty(text) && this.str.length > 0) {
        this.str += ", "
    }

    this.str += text;
};

AuditStream.prototype.endLine = function () {
    console.log(this.str)
};

module.exports = AuditStream;
