import {LitElement, html} from 'https://unpkg.com/lit-element/lit-element.js?module';
import './server-status.js';

class DebugClient extends LitElement {
  static get properties() {
    return {
    }
  }

  constructor() {
    super();
  }

  render() {
    return html`
      <style>
        :host {
          display: flex;
          flex-direction: column;
          padding: 10px;
        }
      </style>
      
      <server-status></server-status>
    `;
  }
}

customElements.define('debug-client', DebugClient);
