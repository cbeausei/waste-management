// MongoDB setup.
const MongoClient = require('mongodb').MongoClient;
const mongoUrl = 'mongodb://localhost:27017/';
const opts = {useUnifiedTopology: true};

export class Db {
  client: any = null;
  collection: any = null;

  constructor() {
    MongoClient.connect(mongoUrl, opts, (err: Error, client: any) => {
      if (err) {
        throw err;
      }
      this.client = client;
      this.collection = client.db('mydb').collection('games');
    });
  }

  async doesGameExist(gameCode: string): Promise<boolean> {
    try {
      const res = await this.collection.findOne({gameCode});
      return res != null;
    } catch (err) {
      throw err;
    }
  }

  async createGame(gameCode: string) {
    const game = {gameCode, started: false};
    this.collection.insertOne(game, (err: Error, res: any) => {
      if (err) throw err;
      console.log(`Game ${gameCode} created.`);
    });
  }

  async startGame(gameCode: string, playerId: number) {
    // TODO: check the player is allowed to start the game.
    const gameQuery = {gameCode};
    try {
      await this.collection.updateOne(gameQuery, {$set: {started: true}});
    } catch (err) {
      throw err;
    }
  }

  async joinGame(gameCode: string, nick: string, playerId: number) {
    try {
      const res = await this.collection.findOne({gameCode});
      let players = res.players || [];
      players.push({nick, playerId});
      await this.collection.updateOne({gameCode}, {$set: {started: false, players}});
      return players.map((player: any) => player.nick);
    } catch (err) {
      throw err;
    }
  }

  async getGameUpdate(gameCode: string) {
    try {
      const res = await this.collection.findOne({gameCode});
      let update: any = {
        started: res.started,
      }
      let players = res?.players || null;
      if (players) {
        update = {
          ...update,
          players: players.map((player: any) => player.nick),
        }
      }
      return update;
    } catch (err) {
      throw err;
    }
  }
}
