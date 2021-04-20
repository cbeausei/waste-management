import {LitElement, html} from 'https://unpkg.com/lit-element/lit-element.js?module';

class AppMain extends LitElement {
  static get properties() {
    return {
      gameCode: {type: String},
      gameCodeError: {type: String},
      nick: {type: String},
      playerId: {type: Number},
      playerIndex: {type: Number},
      ready: {type: Boolean},
      state: {type: Object},
      showDetails: {type: Boolean},
    }
  }

  constructor() {
    super();

    // Constants.
    this.updateRateMs = 500;
    
    // State variables.
    this.gameCode = null;
    this.gameCodeError = null;
    this.playerId = null;
    this.playerIndex = null;
    this.nick = null;
    this.state = null;
    this.ready = false;
    this.gameData = null;
    this.showDetails = false;
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
      [bold] {
        font-weight: 700;
      }
      [flex-line] {
        align-items: center;
        display: flex;
      }
      [red] {
        color: red;
      }
    </style>
    `;
  }

  renderNickSelectionPage() {
    return html`
      ${this.baseStyle}
      <h3>Pick a nickname:</h3>
      <div>
        <input @keyup="${this.chooseNick}" id="player-nick" type="text">
        <button @click="${this.chooseNick}">Confirm</button>
      </div>
    `;
  }

  renderGameSelectionPage() {
    return html`
      ${this.baseStyle}
      <h3>Player <span nick>${this.nick}</span></h3>
      <div>
        <button @click="${this.createGame}">Create a new game</button>
      </div>
      <p>Or enter a game code:</p>
      <div>
        <input @keyup="${this.joinGame}" id="game-code" type="text">
        <button @click="${this.joinGame}">Join</button>
      </div>
      ${this.gameCodeError != null ? html`<div error>${this.gameCodeError}</div>` : html``}
    `;
  }
  
  renderWaitingGameCreationPage() {
    return html`
      ${this.baseStyle}
      <p>Creating game, please wait a few seconds...</p>
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
        
      </style>

      <div>
        ${this.state.lastPollutionCard ? html`
          <p>
            <span red>Last pollution card:</span>
            <span>${this.gameData.cityNames[this.state.lastPollutionCard[0]]} (2), </span>
            <span>${this.gameData.cityNames[this.state.lastPollutionCard[1]]} (1)</span>
          </p>
        ` : html``}
        <p>I'm player <b>${this.nick}</b></p>
        <p>I'm at <b>${this.gameData.cityNames[this.state.playerLocation[this.playerIndex]]}</b></p>
        ${this.state.playerTurn === this.playerIndex ? html`
          <p>Your turn (actions left: <b red>${this.state.remainingActions}</b>)</p>
          <p>
            <select id="city-select">
              ${this.gameData.cityNames.map((city, i) => html`
                <option value=${i}>${city}</option>
              `)}
            </select>
            <button @click="${this.changeCity}">Move to this city</button>
          </p>
        ` : html`
          ${this.state.players[this.state.playerTurn]}'s turn
        `}
        <p>
          <button @click="${this.toggleDetails}">
            ${this.showDetails ? html`Hide state` : html`Show state`}
          </button>
        </p>
        ${this.showDetails ? html`
          <p>Ocean waste count: <b red>${this.state.oceanWasteCount}</b></p>
          <p>
            <span>Cities</span>
            <ul>
              ${this.state.cityStates.map((waste, i) => html`
                <li>
                  ${this.gameData.cityNames[i]} (${waste[0]}, ${waste[1]}, ${waste[2]})
                </li>
              `)}
            </ul>
          </p>
        ` : html``}
      </div>
    `
  }

  render() {
    if (this.nick == null) {
      return this.renderNickSelectionPage();
    }
    if (this.gameCode == null || this.gameCodeError != null) {
      return this.renderGameSelectionPage();
    }
    if (this.state == null) {
      return this.renderWaitingGameCreationPage();
    }
    if (!this.state.started) {
      return this.renderLobbyPage();
    }
    return this.renderGamePage();
  }

  toggleDetails() {
    this.showDetails = !this.showDetails;
  }

  async changeCity() {
    const newCityId = this.shadowRoot.getElementById('city-select').value;
    await this.queryServer('/game/play', {
      move: {
        type: 'move',
        cityId: newCityId,
      },
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
