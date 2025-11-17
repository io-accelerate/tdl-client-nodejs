export function compressText(text) {
    // DEBT compress text should not add quotes
    const allLines = text.match(/[^\r\n]+/g) || [""];
    const topLine = allLines[0];
    const linesRemaining = allLines.length - 1;

    if (linesRemaining > 1) {
        return "\"" + topLine + " .. ( " + linesRemaining + " more lines )\"";
    } else if (linesRemaining === 1) {
        return "\"" + topLine + " .. ( 1 more line )\"";
    }
    return "\"" + topLine + "\"";
}

export function stringifyData(data) {
    if (typeof data === 'string' || data instanceof String) {
        return compressText(data);
    }
    if (typeof data !== 'undefined') {
        return JSON.stringify(data).replace(new RegExp(',', 'g'), ', ');
    }
    return 'undefined';
}

