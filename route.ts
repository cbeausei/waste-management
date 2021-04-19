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

// Serve the JS client.
app.use('/js', express.static('client/js'));
app.get('/', (req, res) => {
  res.sendFile(clientRoot + 'index.html');
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
    await db.joinGame(gameCode, req.body.nick, playerId);
    res.send({playerId});
  } catch (err) {
    res.status(403).end(err.message);
  }
});

// Player starts a game.
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
    const update = await db.getGameUpdate(req.body.gameCode);
    res.send(update);
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
