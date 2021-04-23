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
      currentWasteType: 0,
      oceanWasteCount: 0,
      lost: false,
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

  checkIntInRange(kind: string, val: any, a: number, b: number) {
    if (isNaN(val) || !Number.isInteger(val) || val < a || val >= b) {
      throw new Error(`Expected a ${kind} in the range [${a}, ${b}], got '${val}'.`);
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
      if (!move?.type) {
        throw new Error('The move must specify a type.');
      }
      switch (move.type) {
        case 'move':
          const cityId = Number(move.cityId);
          this.checkIntInRange('city ID', cityId, 0, gameData.cityCount);
          game.state.playerLocation[playerIndex] = cityId;
          break;
        case 'clean':
          const wasteType = Number(move.wasteType);
          this.checkIntInRange('waste type', wasteType, 0, gameData.wasteCount);
          game.state.cityStates[game.state.playerLocation[playerIndex]][wasteType] = 0;
          break;
        default:
          throw this.unimplementedError();
      }

      // Update player turn.
      game.state.remainingActions -= 1;
      if (game.state.remainingActions <= 0) {
        // Change player.
        game.state.playerTurn = (game.state.playerTurn + 1) % game.playerIds.length;
        game.state.remainingActions = gameData.actionsPerTurn;
        
        // Draw pollution card.
        const city1 = Math.floor(Math.random() * gameData.cityCount);
        let city2 = city1;
        while (city2 === city1) {
          city2 = Math.floor(Math.random() * gameData.cityCount);
        }
        const city1Waste = game.state.cityStates[city1].reduce((a: number, b: number) => a + b);
        const city1Overflow = Math.max(0, city1Waste + 2 - gameData.maxCityWasteCount);
        game.state.cityStates[city1][game.state.currentWasteType] += 2 - city1Overflow;
        game.state.oceanWasteCount += city1Overflow;
        const city2Waste = game.state.cityStates[city2].reduce((a: number, b: number) => a + b);
        const city2Overflow = Math.max(0, city2Waste + 1 - gameData.maxCityWasteCount);
        game.state.cityStates[city2][game.state.currentWasteType] += 1 - city2Overflow;
        game.state.oceanWasteCount += city2Overflow;
        game.state.lastPollutionCard = [city1, city2];
        
        // Checking lose conditions.
        if (game.state.oceanWasteCount >= gameData.maxOceanWasteCount) {
          game.state.lost = true;
        }

        // Change waste type.
        game.state.currentWasteType = (game.state.currentWasteType + 1) % gameData.wasteCount;
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
