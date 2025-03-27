[![Node Version](http://img.shields.io/badge/Node-5.6.0-green.svg)](https://nodejs.org/dist/latest-v5.x/)
[![npm](http://img.shields.io/npm/v/tdl-client.svg?maxAge=2592000)](https://www.npmjs.com/package/tdl-client-nodejs)
[![Codeship Status for julianghionoiu/tdl-client-nodejs](https://img.shields.io/codeship/f6d0ec40-2c31-0134-f32a-2a45120acafc.svg)](https://codeship.com/projects/163364)
[![Coverage Status](https://coveralls.io/repos/github/julianghionoiu/tdl-client-nodejs/badge.svg?branch=master)](https://coveralls.io/github/julianghionoiu/tdl-client-nodejs?branch=master)

# tdl-client-nodejs

### Submodules

Project contains submodules as mentioned in the `.gitmodules` file:
- tdl-client-spe (gets cloned into features)

Use the below command to update the submodules of the project:

```
git submodule update --init
```

### Getting started

Install the required Node version
```shell
nvm install 8.17.0
node --version
```
Install the required dependencies
```shell
npm install
```

# Testing

All test require the ActiveMQ broker and Wiremock to be started.

Start ActiveMQ
```shell
export ACTIVEMQ_CONTAINER=apache/activemq-classic:6.1.0
docker run -d -it --rm -p 28161:8161 -p 21613:61613 -p 21616:61616 --name activemq ${ACTIVEMQ_CONTAINER}
```

The ActiveMQ web UI can be accessed at:
http://localhost:28161/admin/
use admin/admin to login

Start two Wiremock servers
```shell
export WIREMOCK_CONTAINER=wiremock/wiremock:3.7.0
docker run -d -it --rm -p 8222:8080 --name challenge-server ${WIREMOCK_CONTAINER}
docker run -d -it --rm -p 41375:8080 --name recording-server ${WIREMOCK_CONTAINER}
```

The Wiremock admin UI can be found at:
http://localhost:8222/__admin/
and docs at
http://localhost:8222/__admin/docs

# Cleanup

Stop dependencies
```
docker stop activemq
docker stop recording-server
docker stop challenge-server
```

# Tests

```
npm test
```

```
npm run example
```

If you want to run the Spec file in your IDE you need to pass `-r ./test` to cucumber-js

**Running Scenarios using cucumber**

Run the below from the project root folder:

```bash
./node_modules/.bin/cucumber-js -r ./test  
```

**Running Scenarios using cucumber and istanbul**

Run the below from the project root folder:

```bash
istanbul cover ./node_modules/.bin/cucumber-js -- -S -r ./test  
```

**Running specific Scenarios using cucumber**

Run the below from the project root folder:

```bash
./node_modules/.bin/cucumber-js --name "[Name of the scenario in the .features file within quotes]" -r ./test  
```

**Running specific Scenarios using cucumber and istanbul**

Run the below from the project root folder:

```bash
istanbul cover ./node_modules/.bin/cucumber-js -- --name "[Name of the scenario in the .features file within quotes]" -S -r ./test  
```

or via the IDE

## To release

`npm login`

`npm config ls`

For new version of Spec
`npm version minor`

For patches without changing the Spec
`npm version patch`

`npm publish`

Then go to https://www.npmjs.com/~

Other notes:
- the major version needs to be changed in package.json
- the deployment has not been configured to run on the CI server
