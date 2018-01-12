'use strict';

function TestActionProvider() {
    this._value = null;
}

TestActionProvider.prototype.get = function() {
    var self = this;
    return new Promise(function(resolve) {
        resolve(self._value);
    });
};

TestActionProvider.prototype.set = function(value) {
    this._value = value;
};

module.exports = new TestActionProvider();
