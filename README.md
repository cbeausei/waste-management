# Climates Waste Management Game

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

If the MongoDB local service doesn't start by itself, or if you rebooted:

3. If not already there, create an empty directory `C:\data\db`
4. Execute `C:\Program Files\MongoDB\Server\4.4\bin\mongod` (replace `4.4` by the version you installed)

You're should be good to go at this stage. If you want a UI to check out the DB:

5. Launch MongoDB Compass, if not already launched
6. Click on "Fill in connection fields individually"
7. No need to update any field (port 27017 should be selected by default), simply click on "Connect"

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