import express from 'express';
import bodyParser from 'body-parser';
import {Db} from './db';
import {gameData} from './game-data';

// App creation.
const app = express();
const port = 5005;
const clientRoot = __dirname + '/client/';
const jsonParser = bodyParser.json();

// DB init.
const db = new Db();

// Constants.
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Serve the JS & debug clients.
app.use('/js', express.static('client/js'));
app.use('/assets', express.static('client/assets'));
app.get('/', (req, res) => {
  res.sendFile(clientRoot + 'client.html');
});
app.get('/debug', (req, res) => {
  res.sendFile(clientRoot + 'debug.html');
});

// Server ping.
app.get('/ping', (req, res) => {
  res.send('pong');
});

// Game creation.
app.get('/game/create', (req, res) => {
  const gameCode = generateGameCode();
  try {
    db.createGame(gameCode);
    res.send({gameCode});
  } catch (err) {
    res.status(403).end(err.message);
  }
});

// Player joins a game.
app.post('/game/join', jsonParser, async (req, res) => {
  const gameCode = req.body.gameCode;
  const playerId = generatePlayerId();
  try {
    const playerIndex = await db.joinGame(gameCode, req.body.nick, playerId);
    res.send({playerId, playerIndex});
  } catch (err) {
    res.status(403).end(err.message);
  }
});

// Player leaves a game.
app.post('/game/leave', jsonParser, async (req, res) => {
  const gameCode = req.body.gameCode;
  const playerId = req.body.playerId;
  try {
    await db.leaveGame(gameCode, playerId);
    res.send({status: 'Success'});
  } catch (err) {
    res.status(403).end(err.message);
  }
});

// Player updates their nick.
app.post('/game/nick', jsonParser, async (req, res) => {
  const gameCode = req.body.gameCode;
  const playerId = req.body.playerId;
  const nick = req.body.nick;
  try {
    await db.updateNick(gameCode, playerId, nick);
    res.send({status: 'Success'});
  } catch (err) {
    res.status(403).end(err.message);
  }
});

// Player switches their readiness.
app.post('/game/ready', jsonParser, async (req, res) => {
  try {
    await db.switchReadiness(req.body.gameCode, req.body.playerId);
    res.send({status: 'Success'});
  } catch (err) {
    res.status(403).end(err.message);
  }
});

// Game update.
app.post('/game/update', jsonParser, async (req, res) => {
  try {
    const update = await db.getGameUpdate(req.body.gameCode, req.body.playerId);
    res.send(update);
  } catch (err) {
    res.status(403).end(err.message);
  }
});

// Player move.
app.post('/game/play', jsonParser, async (req, res) => {
  try {
    await db.play(req.body.gameCode, req.body.playerId, req.body.action);
    res.send({status: 'ok'});
  } catch (err) {
    res.status(403).end(err.message);
  }
});

// Get game data.
app.get('/game/data', (req, res) => {
  res.send({gameData});
});

function generateGameCode(): string {
  let gameCode = '';
  for (let _ = 0; _ < 4; ++_) {
    const letter = Math.floor(Math.random() * 26);
    gameCode += alphabet[letter];
  }
  return gameCode;
}

function generatePlayerId(): number {
  return Math.floor(Math.random() * 1000000000);
}

app.listen(port, () => {
  console.log(`Server running at localhost:${port}/`);
});
