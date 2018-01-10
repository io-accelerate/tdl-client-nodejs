'use strict';

function TestActionProvider() {
    this._value = null;
}

TestActionProvider.prototype.get = function() {
    return new Promise(function(resolve) {
        resolve(this._value);
    });
};

TestActionProvider.prototype.set = function(value) {
    this._value = value;
};

module.exports = new TestActionProvider();
