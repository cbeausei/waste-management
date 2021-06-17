# Waste management game server

## Prototype

* single app: https://waste-management.cbeausei.eu
* master debugging: https://waste-management.cbeausei.eu/debug

## Requirements

* NodeJS & npm
* MongoDB running on port 27017

See below for install instructions.

### Install NodeJS

On linux:

```
apt-get install node
```

On windows:

1. Download the latest version from https://nodejs.org/en/download/
2. Follow install instruction, then `node` will be available as CLI

### Install and start the DB

On linux:

```
apt-get install mongodb
sudo systemctl start mongod
```

On windows:

1. Download MongoDB Compass from https://www.mongodb.com/try/download/community
2. Follow install instructions
3. Once launched, click on "Fill in connection fields individually"
4. No need to update any field (port 27017 should be selected by default), simply click on "Connect"

## Build

```
npm i
```

### Create the DB collection

```
node scripts/createDb.js
```

## Run

```
npm start
```

This start the server on port 5005.