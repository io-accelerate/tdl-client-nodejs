import RemoteJmxBroker from './utils/jmx/broker/remote_jmx_broker.js';

function TestBroker() {
    this._hostname = 'localhost';
    this._port = 28161;
    this._brokerName = 'localhost';
}

TestBroker.prototype.connect = function () {
    return RemoteJmxBroker.connect(this._hostname, this._port, this._brokerName);
};

const testBroker = new TestBroker();

export default testBroker;
