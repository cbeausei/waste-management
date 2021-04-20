// MongoDB setup.
import {gameData} from './game-data';
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
    const cityStates = [];
    for (let i = 0; i < gameData.cityCount; ++i) {
      cityStates.push([0, 0, 0]);
    }
    return {
      started: false,
      players: [],
      ready: [],
      playerTurn: 0,
      remainingActions: gameData.actionsPerTurn,
      playerLocation: [],
      cityStates,
    };
  }

  internalError() {
    return new Error('Internal error.');
  }

  unimplementedError() {
    return new Error(`This feature isn't implemented yet.`);
  }

  notPlayerTurnError() {
    return new Error(`This isn't this player's turn.`);
  }

  gameNotFoundError(gameCode: string) {
    return new Error(`No game found with code ${gameCode}.`);
  }

  playerNotInGameError(gameCode: string) {
    return new Error(`This player can't access the game with code ${gameCode}.`);
  }

  async createGame(gameCode: string) {
    const newGame = {gameCode, playerIds: [], state: this.getInitialState()};
    try {
      await this.collection.insertOne(newGame);
      console.log(`Game ${gameCode} created.`);
    } catch (err) {
      if (err.name === 'MongoError') {
        console.error(err);
        throw this.internalError();
      } else {
        throw err;
      }
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
        await this.maybeStartGame(gameCode);
      }
    } catch (err) {
      if (err.name === 'MongoError') {
        console.error(err);
        throw this.internalError();
      } else {
        throw err;
      }
    }
  }

  async maybeStartGame(gameCode: string) {
    try {
      const game = await this.collection.findOne({gameCode});
      if (!game?.state) {
        throw this.gameNotFoundError(gameCode);
      }
      if (game.playerIds.length <= 1) {
        return;
      }
      game.state.started = true;
      game.state.playerCount = game.playerIds.length;
      await this.collection.updateOne({gameCode}, {$set: game});
    } catch (err) {
      if (err.name === 'MongoError') {
        console.error(err);
        throw this.internalError();
      } else {
        throw err;
      }
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
      game.state.playerLocation.push(gameData.cityStart);
      await this.collection.updateOne({gameCode}, {$set: game});
      return game.playerIds.length - 1;
    } catch (err) {
      if (err.name === 'MongoError') {
        console.error(err);
        throw this.internalError();
      } else {
        throw err;
      }
    }
  }

  async getGameUpdate(gameCode: string, playerId: number) {
    try {
      const game = await this.collection.findOne({gameCode});
      if (!game?.state || !game?.playerIds) {
        throw this.gameNotFoundError(gameCode);
      }
      let playerIndex = null;
      for (let i = 0; i < game.playerIds.length; ++i) {
        if (playerId === game.playerIds[i]) {
          playerIndex = i;
        }
      }
      if (playerIndex == null) {
        throw this.playerNotInGameError(gameCode);
      }
      return {state: game.state, playerIndex};
    } catch (err) {
      if (err.name === 'MongoError') {
        console.error(err);
        throw this.internalError();
      } else {
        throw err;
      }
    }
  }

  async play(gameCode: string, playerId: number, move: any) {
    try {
      // Fetch the game, if it exists.
      const game = await this.collection.findOne({gameCode});
      if (!game?.state || !game?.playerIds) {
        throw this.gameNotFoundError(gameCode);
      }

      // Check if this is the player's turn.
      let playerIndex = null;
      for (let i = 0; i < game.playerIds.length; ++i) {
        if (playerId === game.playerIds[i]) {
          playerIndex = i;
        }
      }
      if (playerIndex == null) {
        throw this.playerNotInGameError(gameCode);
      }
      if (game.state.playerTurn != playerIndex) {
        throw this.notPlayerTurnError();
      }

      // Apply the move, if valid.
      switch (move?.type) {
        case 'move':
          const newCityId = move?.cityId;
          game.state.playerLocation[playerIndex] = newCityId;
          break;
        default:
          throw this.unimplementedError();
      }

      // Update player turn.
      game.state.remainingActions -= 1;
      if (game.state.remainingActions <= 0) {
        game.state.playerTurn = (game.state.playerTurn + 1) % game.playerIds.length;
        game.state.remainingActions = gameData.actionsPerTurn;
      }

      // Save the new state.
      await this.collection.updateOne({gameCode}, {$set: game});
    } catch (err) {
      if (err.name === 'MongoError') {
        console.error(err);
        throw this.internalError();
      } else {
        throw err;
      }
    }
    
  }
}
