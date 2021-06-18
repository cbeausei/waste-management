import {LitElement, html} from 'https://unpkg.com/lit-element/lit-element.js?module';
import {generateNick} from './utils.js';
import './support-display.js';
import './waste-display.js';

class AppMain extends LitElement {
  static get properties() {
    return {
      gameCode: {type: String},
      gameCodeError: {type: String},
      actionError: {type: String},
      nick: {type: String},
      playerId: {type: Number},
      playerIndex: {type: Number},
      ready: {type: Boolean},
      state: {type: Object},
      showDetails: {type: Boolean},
      selectContent: {type: Object},
    }
  }

  constructor() {
    super();
    this.reset(); 
    this.fetchGameData().then(gameData => {
      this.gameData = gameData;
    });
    this.requestServerUpdate();

    // Shared templates.
    this.baseStyle = html`
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined" rel="stylesheet">
    <style>
      *, *:before, *:after {
        box-sizing: inherit;
      }
      :host {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        font-family: 'Roboto', sans-serif;
        height: 100%;
        padding: 8px;
        width:100%;
      }
      h2, h3, p, ul {
        margin: 5px 0;
      }
      button:hover {
        cursor: pointer;
      }
      [error] {
        color: red;
      }
      [bold] {0
        font-weight: 700;
      }
      [flex-line] {
        align-items: center;
        display: flex;
      }
      b[red] {
        color: red;
      }
      span[red] {
        color: red;
      }
      b[green] {
        color: green;
      }
    </style>
    `;
  }

  reset() {
    // Constants.
    this.updateRateMs = 500;
    
    // State variables.
    this.gameCode = null;
    this.gameCodeError = null;
    this.actionError = null;
    this.playerId = null;
    this.playerIndex = null;
    this.nick = generateNick();
    this.state = null;
    this.ready = false;
    this.showDetails = false;
    this.selectContent = {
      cityId: 0,
      wasteType: 0,
      supportType: 0,
      cardIds: [],
    };
  }

  renderWelcomePage() {
    return html`
      ${this.baseStyle}
      <style>
        [logo-container] {
          display: flex;
          justify-content: center;
        }
        [logo-container]:hover {
          cursor: pointer;
        }
        [logo] {
          width: 300px;
        }
        [title] {
          align-items: center;
          display: flex;
          font-size: 30px;
          justify-content: center;
          text-align: center;
          margin-bottom: 16px;
        }
        [title-icon] {
          font-size: 50px;
          margin: 5px;
        }
        [paragraph] {
          margin: 24px;
        }
        [container] {
          margin: 0 24px;
        }
        [boxes] {
          align-items: center;
          display: flex;
          justify-content: center;
        }
        [box] {
          align-items: center;
          border: solid 3px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          height: 200px;
          justify-content: center;
          margin: 15px;
          padding: 15px;
          text-align: center;
          width: 38%;
        }
        [box] > * {
          margin: 4px 0;
        }
        [box] [hover] {
          display: none;
        }
        [box]:hover {
          cursor: pointer;
        }
        [box]:hover [nothover] {
          display: none;
        }
        [box]:hover [hover] {
          display: inline-block;
        }
        [box][red] {
          border-color: red;
        }
        [box][red]:hover {
          background-color: rgba(255, 0, 0, 0.3);
        }
        [box][blue] {
          border-color: blue;
        }
        [box][blue]:hover {
          background-color: rgba(0, 0, 255, 0.3);
        }
        [lobby-header] {
          align-items: baseline;
          display: flex;
          font-size: 24px;
        }
        [lobby-header] [gamecode] {
          color: limegreen;
          font-size: 30px;
          margin-left: 10px;
        }
        [lobby] [button] {
          margin-right: 5px;
        }
        [players] {
          margin: 24px 0;
        }
        [player-container] {
          align-items: center;
          display: flex;
          margin: 5px 0;
        }
        [player] {
          align-items: center;
          background-color: lightgoldenrodyellow;
          border: solid 1px black;
          border-radius: 25px;
          display: flex;
          margin-right: 10px;
          max-width: 300px;
          padding: 15px 10px;
          width: 100%;
        }
        [player][ready] {
          background-color: darkseagreen;
        }
        [player] [nick] {
          color: mediumblue;
          font-weight: 700;
        }
        [player] > span {
          margin-left: 10px;
        }
        [actions] {
          align-items: center;
          display: flex;
        }
        [action] {
          border: solid 1px black;
          border-radius: 10px;
          margin-right: 10px;
          padding: 10px 15px;
          text-align: center;
          width: 150px;
        }
        [action]:hover {
          cursor: pointer;
        }
        [action][green]:hover {
          background-color: darkseagreen;
        }
        [action][yellow]:hover {
          background-color: lightgoldenrodyellow;
        }
        [action][red]:hover {
          background-color: indianred;
        }
      </style>

      <!-- Header -->
      <a logo-container href="https://weareclimates.org"
           target="_blank">
        <img logo src="./assets/climates_logo.webp">
      </a>
      <div title>
        <span title-icon class="material-icons">delete</span>
        <span>Waste Management Game</span>
      </div>
      <div paragraph>
        Understand, playing a fun game, trade-offs between
        short-term waste management and implementation of
        long-term solutions, making sure not to overload
        our oceans with waste !
      </div>

      <!-- Initial selection -->
      ${this.gameCode == null ? html`
        <div boxes>
          <div box red @click="${this.createGame}">
            <span>Start a new game and invite friends</span>
            <span nothover class="material-icons">delete</span>
            <span hover class="material-icons">delete_outline</span>
          </div>
          <div>or</div>
          <div box blue @click="${this.joinGame}">
            <span>Join a game created by a friend</span>
            <span nothover class="material-icons">delete</span>
            <span hover class="material-icons">delete_outline</span>
          </div>
        </div>
        ${this.gameCodeError != null ? html`<div error>${this.gameCodeError}</div>` : html``}
      ` : html ``}

      <!-- Loading -->
      ${this.gameCode !== null && this.state == null ? html`
        <div container>
          Loading game...
        </div>
      ` : html``}

      <!-- Lobby -->
      ${this.state !== null ? html`
        <div container>
          <div lobby-header>
            <span><b>Game</b></span>
            <span gamecode>${this.gameCode}</span>
          </div>
          <div lobby>
            <p>
              <button @click="${this.copyGameCode}">Copy code</button>
              <button @click="${this.copyGameUrl}">Copy game URL</button>
            </p>
            <p style="margin-top: 15px;">
              Invite your friends by sending them the game
              code or URL !
            </p>
          </div>
          <div players>
            ${this.state.players.map((nick, i) => html`
              <div player-container>
                <div player ?ready=${this.state.ready[i]}>
                  ${this.state.ready[i] ? html`
                    <span class="material-icons-outlined">check_circle</span>
                  ` : html`
                    <span class="material-icons-outlined">hourglass_empty</span>
                  `}
                  <span ?nick=${i === this.playerIndex}>${nick}</span>
                </div>
                ${i === this.playerIndex ? html`
                  <span class="material-icons-outlined">person</span>
                ` : html``}
              </player-container>
            `)}
          </div>
          <div actions>
            <div action @click="${this.switchReadiness}"
                 ?green=${!this.ready} ?yellow=${this.ready}>
              ${!this.ready ? html`I'm ready` : html`Wait`}
            </div>
            <div action red @click="${this.leaveGame}">
              Leave
            </div>
          </actions>
        </div>
      ` : html``}
    `;
  }

  renderGamePage() {
    return html`
      ${this.baseStyle}
      <style>
        [cities] {
          display: flex;
          flex-direction: column;
          margin-left: 20px;
        }
        [city] {
          display: flex;
          width: 320px;
        }
        [city] > span {
          flex: 1;
        }
        [city] > waste-display {
          flex: 2;
        }
        [card] {
          align-items: center;
          display: inline-flex;
        }
        [card] > * {
          margin-left: 7px;
        }
        [w0] {
          background-color: cornflowerblue;
        }
        [w1] {
          background-color: limegreen;
        }
        [w2] {
          background-color: yellow;
        }
        support-display {
          display: flex;
          margin-bottom: 10px;
          margin-left: 20px;
          margin-top: 7px;
          width: 120px;
        }
        [selection-span] {
          display: inline-flex;
          width: 65px;
        }
        li {
          margin-bottom: 4px;
        }
        button[op] {
          opacity: 0.4;
        }
        [box-visual] {
          background-color: rgba(0, 0, 0, 0.15);
          border: solid 1px black;
          border-radius: 20px;
          margin: 10px auto;
          padding: 10px 20px;
          width: calc(100% - 20px);
        }
      </style>

      <div>
        ${this.state.win ? html`
          <h3><b green>YOU WON!!</b></h3>
        ` : html``}
        ${this.state.lost ? html`
          <h3><b red>GAME OVER</b></h3>
        ` : html``}
        ${this.state.lastPollutionCard ? html`
          <p>
            <span red>Last pollution card:</span>
            <span>${this.gameData.cityNames[this.state.lastPollutionCard[0]]} (2), </span>
            <span>${this.gameData.cityNames[this.state.lastPollutionCard[1]]} (1)</span>
          </p>
        ` : html``}
        <p>I'm <b>${this.nick}</b> at <b>
          ${this.gameData.cityNames[this.state.playerLocation[this.playerIndex]]}</b>.
        </p>
        ${this.state.playerTurn === this.playerIndex && !this.state.lost && !this.state.win ? html`
          <p>My turn</p>
          <div box-visual>
            <span>Selections</span>
            <ul>
              <li>
                <div selection-span>City:</div>
                <select id="city-select" @change="${this.selectChange}">
                  ${this.gameData.cityNames.map((city, i) => html`
                    <option value=${i} ?selected=${this.selectContent.cityId === i}>
                      ${city}
                    </option>
                  `)}
                </select>
              </li>
              <li>
                <div selection-span>Waste:</div>
                <select id="waste-select" w0 @change="${this.selectChange}"
                    ?w0=${this.selectContent.wasteType === 0}
                    ?w1=${this.selectContent.wasteType === 1}
                    ?w2=${this.selectContent.wasteType === 2}>
                  ${this.gameData.wasteNames.map((wasteType, i) => html`
                    <option value=${i} ?selected=${this.selectContent.wasteType === i}
                            ?w0=${i === 0} ?w1=${i === 1} ?w2=${i === 2}>
                      ${wasteType}
                    </option>
                  `)}
                </select>
              </li>
              <li>
                <div selection-span>Support:</div>
                <select id="support-select" @change="${this.selectChange}">
                  ${this.gameData.supportNames.map((support, i) => html`
                    <option value=${i} ?selected=${this.selectContent.supportType === i}>
                      ${support}
                    </option>
                  `)}
                </select>
              </li>
              <li>
                ${this.state.playerCards[this.playerIndex].length > 0 ? html`
                  <div selection-span>Cards:</div>
                  ${this.state.playerCards[this.playerIndex].map((card, i) => html`
                    <div card>
                      <input type="checkbox" id="card-${i}" @change="${this.selectChange}"
                             ?checked=${this.selectContent.cardIds.includes(i)}>
                      <waste-display values=${JSON.stringify(card)}></waste-display>
                    </div>
                  `)}
                ` : html `
                  <span>No solution card in hand</span>
                `}
              </li>
            </ul>
          </div>
          <div box-visual>
            <span>Actions (<b red>${this.state.remainingActions}</b> left)</span>
            <ul>
              <li>
                <button @click="${this.passTurn}">
                  Pass
                </button>
              <li>
                <button @click="${this.changeCity}">
                  Move to <b>${this.gameData.cityNames[this.selectContent.cityId]}</b>
                </button>
              </li>
              <li>
                <button @click="${this.cleanWaste}">Clean <b>${
                    this.gameData.wasteNames[this.selectContent.wasteType]}</b>
                    waste in <b>${this.gameData.cityNames[this.state.playerLocation[this.playerIndex]]}</b>
                </button>
              </li>
              ${this.state.playerCards[this.playerIndex].length > 0 ? html`
                <li>
                  <button @click="${this.implementSolution}"
                          ?op=${this.selectContent.cardIds.length <= 0}>
                    Combine <b>${this.selectContent.cardIds.length}</b> card${
                      this.selectContent.cardIds.length >= 2 ? html`s` : html``} to implement a solution in <b>${
                      this.gameData.cityNames[this.state.playerLocation[this.playerIndex]]}</b> for the <b>
                      ${this.gameData.wasteNames[this.selectContent.wasteType]}</b> waste (support: <b>${
                      this.gameData.supportNames[this.selectContent.supportType]}</b>)
                  </button>
                </li>
              ` : html``}
            </ul>
            ${this.actionError != null ? html`
              <span red>${this.actionError}</span>
            ` : html``}
          </div>
        ` : html`
          <p>
            ${this.state.players[this.state.playerTurn]}'s turn
          </p>
          <p>
            ${this.state.playerCards[this.playerIndex].length > 0 ? html`
              <span>My cards:</span>
              ${this.state.playerCards[this.playerIndex].map((card, i) => html`
                <div card>
                  <waste-display values=${JSON.stringify(card)}></waste-display>
                </div>
              `)}
            ` : html `
              No solution card in hand.
            `}
          </p>
        `}
        <p>
          <button @click="${this.toggleDetails}">
            ${this.showDetails ? html`Hide state` : html`Show state`}
          </button>
        </p>
        ${this.showDetails ? html`
          <div box-visual>
            <p>Ocean waste count: <b red>${this.state.oceanWasteCount}</b></p>
            <p>
              <span>Supports</span>
              <support-display values=${JSON.stringify(this.state.support)} max=${this.gameData.maxSupportLevel}>
              </support-display>
            </p>
            <p>
              <span>Players</span>
              <ul>
                ${this.state.players.map((nick, i) => html`
                  ${this.playerIndex !== i ? html`
                    <li>
                      <span><b>${nick}</b> is in <b>${
                          this.gameData.cityNames[this.state.playerLocation[i]]}</b>
                      </span>
                      ${this.state.playerCards[i].map(card => html`
                        <div card>
                          <waste-display values=${JSON.stringify(card)}></waste-display>
                        </div>
                      `)}
                    </li>
                  ` : html``}
                `)}
              </ul>
            </p>
            <p>
              <span>Cities</span>
              <div cities>
                ${this.state.cityStates.map((waste, i) => html`
                  <div city>
                    <span>${this.gameData.cityNames[i]}</span>
                    <waste-display showTotal values=${JSON.stringify(waste)}></waste-display>
                  </div>
                `)}
              </div>
            </p>
          </div>
        ` : html``}
      </div>
    `
  }

  render() {
    if (this.gameCode == null || !this.state?.started) {
      return this.renderWelcomePage();
    }
    return this.renderGamePage();
  }

  toggleDetails() {
    this.showDetails = !this.showDetails;
  }

  selectChange(event) {
    const cityId = Number(this.shadowRoot.getElementById('city-select').value);
    const supportType = Number(this.shadowRoot.getElementById('support-select').value);
    const wasteSelect = this.shadowRoot.getElementById('waste-select');
    const wasteType = Number(wasteSelect.value);
    wasteSelect.removeAttribute('w0');
    wasteSelect.removeAttribute('w1');
    wasteSelect.removeAttribute('w2');
    wasteSelect.setAttribute(`w${wasteType}`, '');
    const cardIds = [];
    for (let i = 0; i < this.state.playerCards[this.playerIndex].length; ++i) {
      if (this.shadowRoot.getElementById(`card-${i}`).checked) {
        cardIds.push(i);
      }
    }
    this.selectContent = {
      cityId,
      wasteType,
      supportType,
      cardIds,
    };
  }

  async sendAction(action) {
    try {
      await this.queryServer('/game/play', {action});
      this.actionError = null;
    } catch (err) {
      this.actionError = err.message;
    }
  }

  passTurn() {
    this.sendAction({
      type: 'pass',
    });
  }

  changeCity() {
    this.sendAction({
      type: 'move',
      cityId: this.selectContent.cityId,
    });
  }

  cleanWaste() {
    this.sendAction({
      type: 'clean',
      wasteType: this.selectContent.wasteType,
    });
  }

  implementSolution() {
    this.sendAction({
      type: 'solution',
      cardIds: this.selectContent.cardIds,
      wasteType: this.selectContent.wasteType,
      supportType: this.selectContent.supportType,
    });
  }

  async copyGameCode() {
    const type = 'text/plain';
    const blob = new Blob([this.gameCode], {type});
    const data = [new ClipboardItem({[type]: blob})];
    await navigator.clipboard.write(data);
    alert('Game code copied to clipboard.');
  }

  async copyGameUrl() {
    const type = 'text/plain';
    const blob = new Blob([`${location.origin}/?gameCode=${this.gameCode}`], {type});
    const data = [new ClipboardItem({[type]: blob})];
    await navigator.clipboard.write(data);
    alert('Game URL copied to clipboard.');
  }

  async queryServer(path, request) {
    const response = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        gameCode: this.gameCode,
        playerId: this.playerId,
      }),
    });
    if (response.status !== 200) {
      const message = await response.text();
      throw new Error(message);
    }
    const json = await response.json();
    return json;
  }

  async fetchGameData() {
    const response = await fetch('/game/data');
    const json = await response.json();
    return json.gameData;
  }

  async createGame() {
    const response = await fetch('/game/create');
    const game = await response.json();
    this.gameCodeError = null;
    this.gameCode = game.gameCode;
    await this.createPlayer();
  }

  async joinGame(event) {
    if (event.keyCode && event.keyCode !== 13) {
      return;
    }
    this.gameCodeError = null;
    this.gameCode = this.shadowRoot.getElementById('game-code').value;
    await this.createPlayer();
  }

  async leaveGame() {
    this.queryServer('/game/leave', {}).then(
      success => {
        this.reset();
      },
      err => {
        this.gameCodeError = err.message;
      }
    );
  }

  async chooseNick(event) {
    if (event.keyCode && event.keyCode !== 13) {
      return;
    }
    this.nick = this.shadowRoot.getElementById('player-nick').value;
    if (this.gameCode) {
      await this.createPlayer();
    }
  }

  async createPlayer() {
    this.queryServer('/game/join', {nick: this.nick}).then(info => {
      this.playerId = info.playerId;
      this.playerIndex = info.playerIndex;
      // TODO: update URL.
    }, err => {
      console.log(err);
      console.log(err.message);
      this.gameCodeError = err.message;
      // TODO: clear URL.
    });
  }

  async switchReadiness() {
    this.ready = !this.ready;
    await this.queryServer('/game/ready');
  }

  async requestServerUpdate() {
    setTimeout(() => this.requestServerUpdate(), this.updateRateMs);
    if (this.gameCode != null) {
      const update = await this.queryServer('/game/update');
      this.state = update.state;
      this.playerIndex = update.playerIndex;
    }
  }

}

customElements.define('app-main', AppMain);
