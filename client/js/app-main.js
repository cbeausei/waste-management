import {LitElement, html} from 'https://unpkg.com/lit-element/lit-element.js?module';

class AppMain extends LitElement {
  static get properties() {
    return {
      gameCode: {type: String},
      gameCodeError: {type: String},
      nick: {type: String},
      playerId: {type: Number},
      players: {type: Array},
      started: {type: Boolean},
    }
  }

  constructor() {
    super();
    
    // State variables.
    this.gameCode = null;
    this.gameCodeError = null;
    this.playerId = null;
    this.nick = null;
    this.started = false;
    this.players = null;

    // Shared styles.
    this.baseStyle = html`
    <style>
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 10px;
        width:100%;
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
      [gamecode] {
        font-weight: 700;
      }
    </style>
    `
  }

  renderNickSelectionPage() {
    return html`
      ${this.baseStyle}
      <h2>Pick a nickname:</h2>
      <div>
        <input @keyup="${this.chooseNick}" id="player-nick" type="text">
        <button @click="${this.chooseNick}">Confirm</button>
      </div>
    `;
  }

  renderGameSelectionPage() {
    return html`
      ${this.baseStyle}
      <h2>Player <span nick>${this.nick}</span></h2>
      <button @click="${this.createGame}">Create a new game</button>
      <p>Or join an existing lobby by entering the game code below:</p>
      <div>
        <input @keyup="${this.joinGame}" id="game-code" type="text">
        <button @click="${this.joinGame}">Join</button>
      </div>
      ${this.gameCodeError != null ? html`<div error>${this.gameCodeError}</div>` : html``}
    `;
  }


  renderPreGamePage() {
    return html`
      ${this.baseStyle}
      <h1>Waiting lobby.</h1>
      <h2>Player <span nick>${this.nick}</span></h2>
      <p>Game code: <span gamecode>${this.gameCode}</span></p>
      <p>Alternatively share the following URL: ${location.origin}/?gameCode=${this.gameCode}</p>
      <h2>Players connected</h2>
      <ul>
        ${this.players.map(nick => html`
          <li>
            ${nick === this.nick ? html`<span nick>${nick}</span>` : html`<span>${nick}</span>`}
          </li>
        `)}
      </ul>
      ${this.players.length > 1 ? html`<button @click="${this.startGame}">Start game</button>` : html``}
    `;
  }

  renderGamePage() {
    return html`
      ${this.baseStyle}
      <p>Game is starting! There are ${this.players.length} players registered.</p>
    `
  }

  render() {
    if (this.nick == null) {
      return this.renderNickSelectionPage();
    }
    if (this.gameCode == null || this.gameCodeError != null) {
      return this.renderGameSelectionPage();
    }
    if (!this.gameStarted) {
      return this.renderPreGamePage();
    }
    return this.renderGamePage();
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
    const json = await response.json();
    return json;
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

  chooseNick(event) {
    if (event.keyCode && event.keyCode !== 13) {
      return;
    }
    this.nick = this.shadowRoot.getElementById('player-nick').value;
  }

  async createPlayer() {
    const info = await this.queryServer('/game/join', {nick: this.nick});
    if (info.error) {
      this.gameCodeError = info.error;
      return;
    }
    this.playerId = info.playerId;
    this.players = info.players;
    this.requestServerUpdate();
  }

  async startGame() {
    const update = await this.queryServer('/game/start');
    this.handleUpdate(update);
  }

  async requestServerUpdate() {
    setTimeout(() => this.requestServerUpdate(), 1000);
    const update = await this.queryServer('/game/update');
    this.handleUpdate(update);
  } 

  handleUpdate(update) {
    if (update.players) {
      this.players = update.players;
    }
    if (update.started === true) {
      this.gameStarted = true;      
    }
  }
}

customElements.define('app-main', AppMain);
