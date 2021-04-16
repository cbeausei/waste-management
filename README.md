# Waste management game server

## Prototype

https://waste-management.cbeausei.eu

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
