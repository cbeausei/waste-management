// MongoDB setup.
const MongoClient = require('mongodb').MongoClient;
const mongoUrl = 'mongodb://localhost:27017/';
const opts = {useUnifiedTopology: true};

export class Db {

async doesGameExist(gameCode: string): Promise<boolean> {
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

createGame(gameCode: string): void {
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

async startGame(gameCode: string, playerId: number) {
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

async joinGame(gameCode: string, nick: string, playerId: number) {
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

async getGameUpdate(gameCode: string) {
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

}
