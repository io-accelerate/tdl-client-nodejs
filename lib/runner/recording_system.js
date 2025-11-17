import http from 'node:http';
const RECORDING_SYSTEM_ENDPOINT = 'http://localhost:41375';

// TODO: Move to separate helper file.
function startsWith (suffix, value) {
    return value && value.indexOf(suffix, 0) === 0;
}

function RecordingSystem(recordingRequired) {
    this._recordingRequired = recordingRequired;
}

RecordingSystem.prototype.isRecordingSystemOk = function() {
    var self = this;

    return new Promise(function(resolve) {
        if (!self._recordingRequired) {
            resolve(true);
            return;
        }

        self.isRunning().then(function(isRunning) {
            resolve(isRunning);
        });
    });
};

RecordingSystem.prototype.isRunning = function() {
    return new Promise(function(resolve) {
        const req = http.get(RECORDING_SYSTEM_ENDPOINT + "/status", (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200 && startsWith('OK', data)) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log("Could not reach recording system: " + error.message);
            resolve(false);
        });

        req.end();
    });
};

RecordingSystem.event = {
    ROUND_START: "new",
    ROUND_SOLUTION_DEPLOY: "deploy",
    ROUND_COMPLETED: "done"
};

RecordingSystem.prototype.onNewRound = function(roundId) {
    return this.notifyEvent(roundId, RecordingSystem.event.ROUND_START);

};

RecordingSystem.prototype.notifyEvent = function(lastFetchedRound, eventName) {
    console.log("Notify round "+lastFetchedRound+", event "+eventName);
    return this._sendPost("/notify", lastFetchedRound+"/"+eventName)
};

RecordingSystem.prototype.tellToStop = function() {
    console.log("Stopping recording system");
    return this._sendPost("/stop","")
};

RecordingSystem.prototype._sendPost = function(endpoint, body) {
    var self = this;
    return new Promise(function(resolve) {
        if (!self._recordingRequired) {
            resolve();

            return;
        }
        const options = {
            hostname: 'localhost',
            port: 41375,
            path: endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode !== 200) {
                    console.log("Recording system returned code: " + res.statusCode);
                }
                if (data.indexOf('ACK') !== 0) {
                    console.log("Recording system returned body:" + data);
                }
                resolve();
            });
        });

        req.on('error', (error) => {
            console.log("Could not reach recording system: " + error.message);
            resolve();
        });

        req.write(body);
        req.end();
    });
};

export default RecordingSystem;
