import express from 'express';
import bodyParser from 'body-parser';

// MongoDB setup.
const MongoClient = require('mongodb').MongoClient;
const mongoUrl = 'mongodb://localhost:27017/';
const opts = {useUnifiedTopology: true};

// App creation.
const app = express();
const port = 5005;
const clientRoot = __dirname + '/client/';
const jsonParser = bodyParser.json();

// Constants.
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Include the JS client.
app.use('/js', express.static('client/js'));

// Serve the JS client
app.get('/', (req, res) => {
  res.sendFile(clientRoot + 'index.html');
});

// Game creation.
app.get('/game/create', (req, res) => {
  const gameCode = generateGameCode();
  createGame(gameCode);
  res.send({gameCode});
});

// Player joins a game.
app.post('/game/join', jsonParser, async (req, res) => {
  const gameCode = req.body.gameCode;
  const playerId = generatePlayerId();
  const gameExists = await doesGameExist(gameCode);
  if (gameExists) {
    const players = await joinGame(gameCode, req.body.nick, playerId);
    res.send({playerId, players});
  } else {
    res.send({error: `No game found for the code ${gameCode}.`});
  }
});

// Player starts a game.
app.post('/game/start', jsonParser, async (req, res) => {
  await startGame(req.body.gameCode, req.body.playerId);
  const update = await getGameUpdate(req.body.gameCode);
  res.send(update);
});

// Game update.
app.post('/game/update', jsonParser, async (req, res) => {
  const update = await getGameUpdate(req.body.gameCode);
  res.send(update);
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

async function doesGameExist(gameCode: string): Promise<boolean> {
  let client = null;
  let gameExists = false;
  try {
    client = await MongoClient.connect(mongoUrl, opts);
  } catch (err) {
    throw err;
  }
  const db = client.db('mydb');
  const gameQuery = {gameCode};
  try {
    const collection = db.collection('games');
    const res = await collection.findOne(gameQuery);
    if (res != null) {
      gameExists = true;
    }
  } catch (err) {
    throw err;
  } finally {
    client.close();
  };
  return gameExists;
}

function createGame(gameCode: string): void {
  MongoClient.connect(mongoUrl, opts, (err: Error, db: any) => {
    if (err) throw err;
    const dbo = db.db('mydb');
    const game = {gameCode, started: false};
    dbo.collection('games').insertOne(game, (err: Error, res: any) => {
      if (err) throw err;
      console.log(`Game ${gameCode} created.`);
        db.close();
    });
  });
}

async function startGame(gameCode: string, playerId: number) {
  // TODO: check the player is allowed to start the game.
  let client = null;
  try {
    client = await MongoClient.connect(mongoUrl, opts);
  } catch (err) {
    throw err;
  }
  const db = client.db('mydb');
  const gameQuery = {gameCode};
  try {
    const collection = db.collection('games');
    await collection.updateOne(gameQuery, {$set: {started: true}});
  } catch (err) {
    throw err;
  } finally {
    client.close();
  };
}

async function joinGame(gameCode: string, nick: string, playerId: number) {
  let players = [];
  let client = null;
  try {
    client = await MongoClient.connect(mongoUrl, opts);
  } catch (err) {
    throw err;
  }
  const db = client.db('mydb');
  const gameQuery = {gameCode};
  try {
    const collection = db.collection('games');
    const res = await collection.findOne(gameQuery);
    players = res.players || [];
    players.push({nick, playerId});
    await collection.updateOne(gameQuery, {$set: {started: false, players}});
  } catch (err) {
    throw err;
  } finally {
    client.close();
  };
  return players.map((player: any) => player.nick);
}

async function getGameUpdate(gameCode: string) {
  let players = [];
  let client = null;
  let update = {};
  try {
    client = await MongoClient.connect(mongoUrl, opts);
  } catch (err) {
    throw err;
  }
  const db = client.db('mydb');
  const gameQuery = {gameCode};
  try {
    const collection = db.collection('games');
    const res = await collection.findOne(gameQuery);
    update = {
      ...update,
      started: res.started,
    }
    players = res?.players || null;
  } catch (err) {
    throw err;
  } finally {
    client.close();
  };
  if (players) {
    update = {
      ...update,
      players: players.map((player: any) => player.nick),
    }
  }
  return update;
}

app.listen(port, () => {
  console.log(`Server running at localhost:${port}/`);
});
