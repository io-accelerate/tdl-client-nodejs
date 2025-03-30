[![Node Version](http://img.shields.io/badge/Node-22.14.0-green.svg)](https://nodejs.org/dist/latest-v22.x/)
[![npm](http://img.shields.io/npm/v/tdl-client.svg?maxAge=2592000)](https://www.npmjs.com/package/tdl-client-nodejs)

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
nvm install 22.14.0

node --version
v22.14.0

npm --version
11.2.0
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

Running all the tests
```shell
./node_modules/.bin/cucumber-js
```

Running specific scenarios
```bash
./node_modules/.bin/cucumber-js --name "[Name of the scenario in the .features file within quotes]"  
```

# To release
Set version manually in `package.json`:
```
  "version": "0.29.1",
```

Commit the changes
```
export RELEASE_TAG="v$(cat package.json  | grep version | cut -d "\"" -f4)"
echo ${RELEASE_TAG}

git add --all
git commit -m "Releasing version ${RELEASE_TAG}"

git tag -a "${RELEASE_TAG}" -m "${RELEASE_TAG}"
git push --tags
git push
```

Wait for the Github build to finish, then go to:
https://rubygems.org/gems/tdl-client-ruby


## To manually release to NVM

Log into NPM
```shell
npm login
```

List the current config
```shell
npm config ls
```

Publish to NPM
```shell
npm publish
```

Then go to https://www.npmjs.com/~

Other notes:
- the major version needs to be changed in package.json
- the deployment has not been configured to run on the CI server
