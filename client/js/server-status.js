import {LitElement, html} from 'https://unpkg.com/lit-element/lit-element.js?module';

class ServerStatus extends LitElement {
  static get properties() {
    return {
      online: {type: Boolean},
      latency: {type: Number},
      latencyColor: {type: String},
    }
  }

  constructor() {
    super();

    this.pingRateMs = 1200;
    this.online = false;
    this.latency = null;
    this.latencyColor = 'black';
    this.pingServer();
  }

  render() {
    return html`
      <style>
        :host {
          align_items: center;
          border: solid 1px black;
          display: flex;
          padding: 5px;
        }
        :host > span {
          padding: 5px 15px;
        }
        [green] {
          color: green;
        }
        [red] {
          color: red;
        }
      </style>
      
      <span>
        Status: ${this.online ? html`
          <span green>online</span>
        ` : html`
          <span red>offline</span>
        `}
      </span>
      ${this.latency ? html`
        <span>
          Latency:
          <span style="color: ${this.latencyColor};">
            ${this.latency}ms
          </span>
        </span>
      ` : html``}
    `;
  }

  async pingServer() {
    setTimeout(() => this.pingServer(), this.pingRateMs);
    const start = Date.now();
    fetch('/ping').then(response => {
      if (!response.ok) {
        throw new Error();
      }
      this.online = true;
      this.latency = Date.now() - start;
      if (this.latency < 20) {
        this.latencyColor = 'green';
      } else if (this.latency < 50) {
        this.latencyColor = 'orange';
      } else {
        this.latencyColor = 'red';
      }
    }).catch((error) => {
      this.online = false;
      this.latency = null;
    });
  }
}

customElements.define('server-status', ServerStatus);
