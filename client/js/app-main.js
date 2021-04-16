import {LitElement, html} from 'https://unpkg.com/lit-element/lit-element.js?module';

class AppMain extends LitElement {
  static get properties() {
    return {
      ping: {type: String},
    }
  }

  constructor() {
    super();
    this.ping = 'Ping...';
    this.queryServer('/game/ping', {}).then(response => {
      this.ping = response.pong;
    });
  }

  render() {
    return html`
      ${this.ping}
    `
  }

  async queryServer(path, request) {
    const response = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
      }),
    });
    const json = await response.json();
    return json;
  }
}

customElements.define('app-main', AppMain);
