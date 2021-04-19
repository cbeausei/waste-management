# Waste management game server

## Prototype

* single app: https://waste-management.cbeausei.eu
* master debugging: https://waste-management.cbeausei.eu/debug

## Requirements

* NodeJS & npm
* MongoDB running on port 27017

### Install dependencies

```
apt-get install node mongodb
```

### Start & init the DB

```
sudo systemctl start mongod
node scripts/createDb.js
```

## Build

```
npm i
```

## Run

```
npm start
```

This start the server on port 5005.
