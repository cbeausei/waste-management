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
    <style>
      *, *:before, *:after {
        box-sizing: inherit;
      }
      :host {
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
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
      [nick] {
        color: blue;
        font-weight: 700;
      }
      [bold] {0
        font-weight: 700;
      }
      [flex-line] {
        align-items: center;
        display: flex;
      }
      [red] {
        color: red;
      }
      [green] {
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
        [title] {
          display: flex;
          font-size: 34px;
          justify-content: center;
        }
        [boxes] {
          align-items: center;
          display: flex;
          flex: 1;
          justify-content: center;
        }
        [box] {
          align-items: center;
          border: solid 3px gold;
          border-radius: 20px;
          display: flex;
          height: 150px;
          margin: 15px;
          padding: 15px;
          text-align: center;
          width: 30%;
        }
        [box]:hover {
          background-color: rgba(0, 0, 0, 0.3);
          cursor: pointer;
        }
      </style>
      <div title>Waste Management Game</div>
      ${this.gameCode == null ? html`
        <div boxes>
          <div box @click="${this.createGame}">
            Start a new game and invite friends
          </div>
          <div box @click="${this.joinGame}">
            Join a game created by a friend
          </div>
        </div>
        ${this.gameCodeError != null ? html`<div error>${this.gameCodeError}</div>` : html``}
      ` : html `
        <h3>
          Joining game...
        </h3>
      `}
      
    `;
  }

  renderLobbyPage() {
    return html`
      ${this.baseStyle}
      <h2>Waiting lobby</h2>
      <p>
        Game code: <span bold>${this.gameCode}</span>
        <button style="margin-left: 5px;" @click="${this.copyGameCode}">Copy code</button>
        <button style="margin-left: 5px;" @click="${this.copyGameUrl}">Copy game URL</button>
      </p>
      <h3>Players</h3>
      <ul>
        ${this.state.players.map((nick, i) => html`
          <li>
            ${i === this.playerIndex ? html`<span nick>${nick}</span>` : html`<span>${nick}</span>`}
            (${this.state.ready[i] ? html`<b>READY</b>` : html`not ready`})
            ${i === this.playerIndex ? html`
              <button @click="${this.switchReadiness}">
                ${!this.ready ? html`I'm ready` : html`Wait`}
              </button>
              <button @click="${this.leaveGame}">Leave</button>
            ` : html``}
          </li>
        `)}
      </ul>
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
    if (this.gameCode == null || this.state == null) {
      return this.renderWelcomePage();
    }
    if (!this.state.started) {
      return this.renderLobbyPage();
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
