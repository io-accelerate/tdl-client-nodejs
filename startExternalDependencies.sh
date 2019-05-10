#!/bin/bash

set -e
set -u
set -o pipefail

startWiremocks() {
    echo "~~~~~~~~~~ Starting Wiremocks on ports 41375 and 8222 ~~~~~~~~~"
    python3 wiremock/wiremock-wrapper.py start 41375
    python3 wiremock/wiremock-wrapper.py start 8222
}

startBroker() {
    echo "~~~~~~~~~~ Starting Broker ~~~~~~~~~"
    python3 broker/activemq-wrapper.py start
}

startWiremocks
startBroker
