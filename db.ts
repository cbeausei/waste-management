// MongoDB setup.
const MongoClient = require('mongodb').MongoClient;
const mongoUrl = 'mongodb://localhost:27017/';
const opts = {useUnifiedTopology: true};

export class Db {

async doesGameExist(gameCode: string): Promise<boolean> {
  let gameExists = false;
  let client;
  try {client = await MongoClient.connect(mongoUrl, opts);}
  catch (err) {throw err;}
  const collection = client.db('mydb').collection('games');
  const gameQuery = {gameCode};
  try {
    const res = await collection.findOne(gameQuery);
    if (res != null) {
      gameExists = true;
    }
  } catch (err) {
    throw err;
  } finally {
    client.close();
  }
  return gameExists;
}

async createGame(gameCode: string) {
  let client: any = null;
  try {client = await MongoClient.connect(mongoUrl, opts);}
  catch (err) {throw err;}
  const collection = client.db('mydb').collection('games');
  const game = {gameCode, started: false};
  collection.insertOne(game, (err: Error, res: any) => {
    if (err) throw err;
    console.log(`Game ${gameCode} created.`);
    client.close();
  });
}

async startGame(gameCode: string, playerId: number) {
  // TODO: check the player is allowed to start the game.
  let client;
  try {client = await MongoClient.connect(mongoUrl, opts);}
  catch (err) {throw err;}
  const collection = client.db('mydb').collection('games');
  const gameQuery = {gameCode};
  try {
    await collection.updateOne(gameQuery, {$set: {started: true}});
  } catch (err) {
    throw err;
  } finally {
    client.close();
  }
}

async joinGame(gameCode: string, nick: string, playerId: number) {
  let players: any[] = [];
  let client;
  try {client = await MongoClient.connect(mongoUrl, opts);}
  catch (err) {throw err;}
  const collection = client.db('mydb').collection('games');
  const gameQuery = {gameCode};
  try {
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
  let update = {};
  let client;
  try {client = await MongoClient.connect(mongoUrl, opts);}
  catch (err) {throw err;}
  const collection = client.db('mydb').collection('games');
  const gameQuery = {gameCode};
  try {
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
