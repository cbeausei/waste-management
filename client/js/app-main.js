import {LitElement, html} from 'https://unpkg.com/lit-element/lit-element.js?module';

class AppMain extends LitElement {
  static get properties() {
    return {
      gameCode: {type: String},
      gameCodeError: {type: String},
      nick: {type: String},
      playerId: {type: Number},
      ready: {type: Boolean},
      state: {type: Object},
    }
  }

  constructor() {
    super();

    // Constants.
    this.updateRateMs = 1000;
    
    // State variables.
    this.gameCode = null;
    this.gameCodeError = null;
    this.playerId = null;
    this.nick = null;
    this.state = null;
    this.ready = false;
    this.gameData = null;
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
      h2, h3, p {
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
      }
      [bold] {
        font-weight: 700;
      }
      [flex-line] {
        align-items: center;
        display: flex;
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
      <button @click="${this.createGame}">Create a new game</button>
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
      <h2>Waiting lobby.</h2>
      <h3>Player <span nick>${this.nick}</span></h3>
      <p>
        Game code: <span bold>${this.gameCode}</span>
        <button @click="${this.copyGameCode}">Copy code</button>
      </p>
      <p>
        <div>Alternatively share the following URL:</div>
        <div flex-line>
          <span bold>${location.origin}/?gameCode=${this.gameCode}</span>
          <button style="margin-left: 5px;" @click="${this.copyGameUrl}">Copy URL</button>
        </div>
      </p>
      <h3>Players connected</h3>
      <ul>
        ${this.state.players.map((nick, i) => html`
          <li>
            ${nick === this.nick ? html`<span nick>${nick}</span>` : html`<span>${nick}</span>`}
            ${this.state.ready[i] ? html`<b>READY</b>` : html`Waiting...`}
          </li>
        `)}
      </ul>
      <div>
        <button @click="${this.switchReadiness}">
          ${!this.ready ? html`I'm ready` : html`Wait`}
        </button>
      </div>
    `;
  }

  renderGamePage() {
    return html`
      ${this.baseStyle}
      <p>Game is starting! There are ${this.state.playerCount} players registered.</p>
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
    const gameData = await response.json();
    return gameData;
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
      console.log(info);
      this.playerId = info.playerId;
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
      this.state = await this.queryServer('/game/update');
    }
  }

}

customElements.define('app-main', AppMain);
