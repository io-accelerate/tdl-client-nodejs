#!/bin/bash

set -e
set -u
set -o pipefail

stopProcessAtPort() {
    PORT=$1
    PID=$(netstat -tulpn | grep :${PORT} | awk '{print $7}' | tr -d "/java" || true)
    if [[ -z "${PID}" ]]; then
        echo "~~~~~~~~~~ Process on port ${PORT} stopped ~~~~~~~~~"
    else
        kill -9 ${PID}
        echo "~~~~~~~~~~ Process on port ${PORT} killed ~~~~~~~~~"
    fi
}

stopWiremocks() {
    echo "~~~~~~~~~~ Stopping Wiremocks listening on ports 41375 and 8222 ~~~~~~~~~"
    python wiremock/fetch-wiremock-and-run.py stop || true

    stopProcessAtPort 41375
    stopProcessAtPort 8222
}

stopBroker() {
    echo "~~~~~~~~~~ Stoping Broker ~~~~~~~~~"
    python broker/activemq-wrapper.py stop || true
}

stopWiremocks
stopBroker