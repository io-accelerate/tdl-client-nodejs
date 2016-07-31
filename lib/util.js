'use strict';

function Util(){}

Util.compressText = function (text) {
    // DEBT compress text should not add quotes
    var allLines = text.match(/[^\r\n]+/g);
    var topLine = allLines[0];
    var linesRemaining = allLines.length - 1;

    if (linesRemaining > 1) {
        return "\""+topLine+" .. ( "+linesRemaining+" more lines )\""
    } else
    if (linesRemaining == 1) {
        return "\""+topLine+" .. ( 1 more line )\""
    } else {
        return "\""+topLine+"\"";
    }
};

Util.compressData = function (data) {
    if (typeof data === 'string' || data instanceof String) {
        return Util.compressText(data)
    } else {
        return data;
    }
};


module.exports = Util;
