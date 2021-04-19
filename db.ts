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
    return {started: false, players: [], ready: []};
  }

  internalError() {
    return new Error('Internal error.');
  }

  gameNotFoundError(gameCode: string) {
    return new Error(`No game found with code ${gameCode}.`);
  }

  async createGame(gameCode: string) {
    const newGame = {gameCode, playerIds: [], state: this.getInitialState()};
    try {
      await this.collection.insertOne(newGame);
      console.log(`Game ${gameCode} created.`);
    } catch (err) {
      console.error(err);
      throw this.internalError();
    }
  }

  async switchReadiness(gameCode: string, playerId: number) {
    try {
      const game = await this.collection.findOne({gameCode});
      if (!game?.state) {
        throw this.gameNotFoundError(gameCode);
      }
      let readyCount = 0;
      for (let i = 0; i < game.playerIds.length; ++i) {
        if (game.playerIds[i] === playerId) {
          game.state.ready[i] = !game.state.ready[i];
          await this.collection.updateOne({gameCode}, {$set: game});
        }
        if (game.state.ready[i]) {
          readyCount += 1;
        }
      }
      if (readyCount === game.playerIds.length) {
        await this.startGame(gameCode);
      }
    } catch (err) {
      console.error(err);
      throw this.internalError();
    }
  }

  async startGame(gameCode: string) {
    try {
      const game = await this.collection.findOne({gameCode});
      if (!game?.state) {
        throw this.gameNotFoundError(gameCode);
      }
      game.state.started = true;
      game.state.playerCount = game.playerIds.length;
      await this.collection.updateOne({gameCode}, {$set: game});
    } catch (err) {
      console.error(err);
      throw this.internalError();
    }
  }

  async joinGame(gameCode: string, nick: string, playerId: number) {
    try {
      const game = await this.collection.findOne({gameCode});
      if (!game?.state) {
        throw this.gameNotFoundError(gameCode);
      }
      if (game.state.started) {
        throw new Error('This game has already started.');
      }
      game.playerIds.push(playerId);
      game.state.ready.push(false);
      game.state.players.push(nick);
      await this.collection.updateOne({gameCode}, {$set: game});
    } catch (err) {
      console.error(err);
      throw this.internalError();
    }
  }

  async getGameUpdate(gameCode: string) {
    try {
      const game = await this.collection.findOne({gameCode});
      if (!game?.state) {
        throw this.gameNotFoundError(gameCode);
      } else {
        return game.state;
      }
    } catch (err) {
      console.error(err);
      throw this.internalError();
    }
  }
}
