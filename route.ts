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

// Game creation.
app.get('/game/create', (req, res) => {
  const gameCode = generateGameCode();
  db.createGame(gameCode);
  res.send({gameCode});
});

// Player joins a game.
app.post('/game/join', jsonParser, async (req, res) => {
  const gameCode = req.body.gameCode;
  const playerId = generatePlayerId();
  const gameExists = await db.doesGameExist(gameCode);
  if (gameExists) {
    await db.joinGame(gameCode, req.body.nick, playerId);
    res.send({playerId});
  } else {
    res.send({error: `No game found for the code ${gameCode}.`});
  }
});

// Player starts a game.
app.post('/game/ready', jsonParser, async (req, res) => {
  await db.switchReadiness(req.body.gameCode, req.body.playerId);
  res.send({status: 'Success'});
});

// Game update.
app.post('/game/update', jsonParser, async (req, res) => {
  const update = await db.getGameUpdate(req.body.gameCode);
  res.send(update);
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
