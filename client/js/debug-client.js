import {LitElement, html} from 'https://unpkg.com/lit-element/lit-element.js?module';
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
      </div>

      <!-- Clients -->
      <div container>
        ${this.clients.map((active, i) => html`
          <div app-container ?on=${active}>
            <div app-header ?on=${active}
                 @click="${() => this.tabSwitch(i)}">
              <span>Client ${i + 1}</span>
            </div>
            <div ?hidden=${!active}>
              <app-main></app-main>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  spawnClient() {
    this.clients.push(true);
    this.clientCount += 1;
  }

  tabSwitch(i) {
    this.clients[i] = !this.clients[i];
    this.switchVar = !this.switchVar;
  }
}

customElements.define('debug-client', DebugClient);
