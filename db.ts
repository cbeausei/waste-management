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
    const support = [];
    for (let i = 0; i < gameData.supportCount; ++i) {
      support.push(0);
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
      win: false,
      playerCards: [],
      hasNewCard: [],
      support,
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
      const cards = [];
      for (let i = 0; i < gameData.initialSolutionCardCount; ++i) {
        cards.push(this.generateSolutionCard());
      }
      game.state.playerCards.push(cards);
      game.state.hasNewCard.push(false);
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

  generateSolutionCard() {
    const newCard = [0, 0, 0];
    let nb = 0;
    for (let it = 0; it < 5; ++it) {
      let plusOne = false;
      if (it === 4 && nb === 0) {
        plusOne = true;
      } else if (nb < 3) {
        plusOne = Math.floor(Math.random() * 2) === 1;
      }
      if (plusOne) {
        const wasteType = Math.floor(Math.random() * gameData.wasteCount);
        newCard[wasteType] += 1;
        nb += 1;
      }
    }
    return newCard;
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
      throw new Error(`Expected a ${kind} in the range [${a}, ${b - 1}], got '${val}'.`);
    }
  }

  async play(gameCode: string, playerId: number, action: any) {
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
      if (!action?.type) {
        throw new Error('The move must specify a type.');
      }
      switch (action.type) {
        case 'pass':
          break;
        case 'move':
          const cityId = Number(action.cityId);
          this.checkIntInRange('city ID', cityId, 0, gameData.cityCount);
          if (cityId === game.state.playerLocation[playerIndex]) {
            throw new Error(`You are already in ${gameData.cityNames[cityId]}.`);
          }
          game.state.playerLocation[playerIndex] = cityId;
          break;
        case 'clean':
          const wasteType = Number(action.wasteType);
          this.checkIntInRange('waste type', wasteType, 0, gameData.wasteCount);
          game.state.cityStates[game.state.playerLocation[playerIndex]][wasteType] = 0;
          break;
        case 'solution':
          // Check card IDs.
          const cardIds: number[] = [];
          const cardSeen = new Set();
          for (const cardId of action.cardIds) {
            const intCardId = Number(cardId);
            if (cardSeen.has(intCardId)) {
              throw new Error(`The card with ID ${intCardId} is selected multiple times.`);
            }
            cardSeen.add(intCardId);
            this.checkIntInRange('card ID', intCardId, 0, game.state.playerCards[playerIndex].length);
            cardIds.push(intCardId);
          }
          // Check waste type.
          const wasteType_ = Number(action.wasteType);
          this.checkIntInRange('waste type', wasteType_, 0, gameData.wasteCount);
          // Check support type.
          const supportType = Number(action.supportType);
          this.checkIntInRange('support type', supportType, 0, gameData.supportCount);
          if (game.state.support[supportType] >= gameData.maxSupportLevel) {
            throw new Error(`The support type ${gameData.supportNames[supportType]} is already maxed out.`);
          }
          // Check faisability.
          if (game.state.cityStates[game.state.playerLocation[playerIndex]][wasteType_] === -1) {
            throw new Error(`A solution is already implemented for the '${
              gameData.wasteNames[wasteType_]}' waste in ${gameData.cityNames[
                game.state.playerLocation[playerIndex]]}.`);
          }
          let solWaste = 0;
          for (const cardId of cardIds) {
            solWaste += game.state.playerCards[playerIndex][cardId][wasteType_];
          }
          const cityWaste = game.state.cityStates[game.state.playerLocation[playerIndex]][wasteType_];
          if (solWaste < cityWaste) {
            throw new Error(`The selected combination of cards can't implement a solution for the '${
              gameData.wasteNames[wasteType_]}' waste in ${gameData.cityNames[
                game.state.playerLocation[playerIndex]]}.`);
          }
          // Apply solution.
          game.state.cityStates[game.state.playerLocation[playerIndex]][wasteType_] = -1;
          const newCards = [];
          for (let cardId = 0; cardId < game.state.playerCards[playerIndex].length; ++cardId) {
            if (!cardSeen.has(cardId)) {
              newCards.push([...game.state.playerCards[playerIndex][cardId]]);
            }
          }
          game.state.playerCards[playerIndex] = newCards;
          game.state.support[supportType] += 1;
          break;
        default:
          throw this.unimplementedError();
      }

      // Check win condition.
      let win = true;
      for (const supportVal of game.state.support) {
        if (supportVal < gameData.maxSupportLevel) {
          win = false;
        }
      }
      if (win) {
        game.state.win = true;
      }

      // Update player turn.
      game.state.remainingActions -= 1;
      if (game.state.remainingActions <= 0 && !game.state.win) {
        // Draw solution card.
        if (game.state.playerCards[playerIndex].length < gameData.maxHandCardsCount) {
          const newCard = this.generateSolutionCard();
          game.state.playerCards[playerIndex].push(newCard);
          game.state.hasNewCard[playerIndex] = true;
        } else {
          game.state.hasNewCard[playerIndex] = false;
        }

        // Change player.
        game.state.playerTurn = (game.state.playerTurn + 1) % game.playerIds.length;
        game.state.remainingActions = gameData.actionsPerTurn;
        
        // Draw pollution card.
        const city1 = Math.floor(Math.random() * gameData.cityCount);
        let city2 = city1;
        while (city2 === city1) {
          city2 = Math.floor(Math.random() * gameData.cityCount);
        }
        if (game.state.cityStates[city1][game.state.currentWasteType] !== -1) {
          const city1Waste = game.state.cityStates[city1].reduce((a: number, b: number) => a + b);
          const city1Overflow = Math.max(0, city1Waste + 2 - gameData.maxCityWasteCount);
          game.state.cityStates[city1][game.state.currentWasteType] += 2 - city1Overflow;
          game.state.oceanWasteCount += city1Overflow;
        }
        if (game.state.cityStates[city2][game.state.currentWasteType] !== -1) {
          const city2Waste = game.state.cityStates[city2].reduce((a: number, b: number) => a + b);
          const city2Overflow = Math.max(0, city2Waste + 1 - gameData.maxCityWasteCount);
          game.state.cityStates[city2][game.state.currentWasteType] += 1 - city2Overflow;
          game.state.oceanWasteCount += city2Overflow;
        }  
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
