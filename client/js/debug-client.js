import {LitElement, html} from 'https://unpkg.com/lit-element/lit-element.js?module';
import './server-status.js';
import './app-main.js';

class DebugClient extends LitElement {
  static get properties() {
    return {
      clientCount: {type: Number},
      clients: {type: Array},
    }
  }

  constructor() {
    super();
    this.clientCount = 0;
    this.clients = [];
  }

  render() {
    return html`
      <style>
        :host {
          display: flex;
          flex-direction: column;
          padding: 10px;
        }
        [container] {
          border: solid 1px black;
          margin: 5px 0;
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
      ${this.clients.map(client => html`
        <div container>
          <app-main></app-main>
        </div>
      `)}
    `;
  }

  spawnClient() {
    this.clients.push(true);
    this.clientCount += 1;
  }
}

customElements.define('debug-client', DebugClient);
