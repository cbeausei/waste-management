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

  getInitialState() {
    return {started: false, players: []};
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
    const game = {gameCode, playerIds: [], state: this.getInitialState()};
    this.collection.insertOne(game, (err: Error, res: any) => {
      if (err) throw err;
      console.log(`Game ${gameCode} created.`);
    });
  }

  async startGame(gameCode: string, playerId: number) {
    // TODO: check the player is allowed to start the game.
    const gameQuery = {gameCode};
    try {
      const game = await this.collection.findOne({gameCode});
      game.state.started = true;
      game.state.playerCount = game.playerIds.length;
      console.log(game);
      await this.collection.updateOne(gameQuery, {$set: game});
    } catch (err) {
      throw err;
    }
  }

  async joinGame(gameCode: string, nick: string, playerId: number) {
    try {
      const game = await this.collection.findOne({gameCode});
      if (game.state.started) {
        return new Error('This game has already started.');
      }
      game.playerIds.push(playerId);
      game.state.players.push(nick);
      await this.collection.updateOne({gameCode}, {$set: game});
    } catch (err) {
      throw err;
    }
  }

  async getGameUpdate(gameCode: string) {
    try {
      const game = await this.collection.findOne({gameCode});
      return game.state;
    } catch (err) {
      throw err;
    }
  }
}
