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
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 10px;
        }
        [container] {
          display: flex;
          flex: 1;
          flex-direction: column;
        }
        [app-container] {
          border: solid 1px black;
          margin: 5px 0;
          flex: 1;
        }
        [spawn] {
          margin: 5px 0;
        }
        [tabs] {
          display: flex;
        }
        [tabs] > * {
          background-color: lavender;
          border-radius: 3px;
          display: flex;
          flex: 1;
          justify-content: center;
          margin: 0 5px;
        }
        [tabs] > *:hover {
          cursor: pointer;
          opacity: 0.8;
        }
        [on] {
          background-color: darkseagreen;
        }
      </style>
      
      <!-- Status header -->
      <server-status></server-status>
      
      <!-- Spawn client button -->
      <div spawn>
        <button @click="${this.spawnClient}">Spawn client</button>
      </div>

      <!-- Tabs -->
      <div tabs>
        ${this.clients.map((active, i) => html`
          <span ?on=${active} @click="${() => this.tabSwitch(i)}">Client ${i + 1}</span>
        `)}
      </div>

      <!-- Clients -->
      <div container>
        ${this.clients.map(active => html`
          <div app-container ?hidden=${!active}>
            <app-main></app-main>
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
