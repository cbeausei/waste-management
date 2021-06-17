import {LitElement, html} from 'https://unpkg.com/lit-element/lit-element.js?module';
import {generateNick} from './utils.js';
import './server-status.js';
import './app-main.js';

class DebugClient extends LitElement {
  static get properties() {
    return {
      clientCount: {type: Number},
      clients: {type: Array},
      switchVar: {type: Boolean},
    }
  }

  constructor() {
    super();
    this.clientCount = 0;
    this.clients = [];
    this.switchVar = false;
  }

  render() {
    return html`
      <style>
        :host {
          --theme-on: darkseagreen;
          --theme-off: lavender;
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 10px;
        }
        button:hover {
          cursor: pointer;
        }
        [container] {
          display: flex;
          flex: 1;
          flex-direction: column;
          overflow-y: auto;
        }
        [app-header] {
          background-color: var(--theme-off);
          display: flex;
          justify-content: center;
          padding-bottom: 0;
        }
        [app-header]:hover {
          cursor: pointer;
          opacity: 0.8;
        }
        [app-header][on] {
          background-color: var(--theme-on);
          padding-bottom: 5px;
        }
        [app-container] {
          border: solid 5px var(--theme-off);
          border-radius: 5px;
          margin: 5px 0;
          flex: 0;
        }
        [app-container][on] {
          border-color: var(--theme-on);
          flex: 1;
        }
        [spawn] {
          margin: 5px 0;
        }
      </style>
      
      <!-- Status header -->
      <server-status></server-status>
      
      <!-- Spawn client button -->
      <div spawn>
        <button @click="${this.spawnClient}">Spawn client</button>
        <button @click="${() =>this.startGame(4, false)}">Start 4 players lobby</button>
        <button @click="${() =>this.startGame(4, true)}">Start 4 players game</button>
      </div>

      <!-- Clients -->
      <div container>
        ${this.clients.map((client, i) => html`
          <div app-container ?on=${client.active}>
            <div app-header ?on=${client.active}
                 @click="${() => this.tabSwitch(i)}">
              <span>Client ${i + 1}</span>
            </div>
            <div ?hidden=${!client.active}>
              ${client.gameCode ? html`
                <app-main gameCode=${client.gameCode}
                          playerId=${client.playerId}
                          playerIndex=${client.playerIndex}
                          nick=${client.nick}>
                </app-main>
              ` : html`
                <app-main></app-main>
              `}
            </div>
          </div>
        `)}
      </div>
    `;
  }

  async queryServer(path, request) {
    const response = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const text = response.text();
      console.log(text);
      return;
    }
    const json = await response.json();
    return json;
  }

  async startGame(playerCount, started) {
    const response = await fetch('/game/create');
    const game = await response.json();
    const gameCode = game.gameCode;
    for (let i = 0; i < playerCount; ++i) {
      const nick = generateNick();
      const info = await this.queryServer('/game/join', {gameCode, nick});
      const playerId = info.playerId;
      this.clients.push({
        active: true,
        gameCode,
        playerId,
        playerIndex: info.playerIndex,
        nick,
      });
    }
    for (let i = 0; i < playerCount; ++i) {
      if (started) {
        await this.queryServer('/game/ready', {gameCode, playerId: this.clients[i].playerId});
      }
    }
    this.clientCount += playerCount;
  }

  spawnClient() {
    this.clients.push({
      active: true,
    });
    this.clientCount += 1;
  }

  tabSwitch(i) {
    this.clients[i].active = !this.clients[i].active;
    this.switchVar = !this.switchVar;
  }
}

customElements.define('debug-client', DebugClient);
