import {LitElement, html} from 'https://unpkg.com/lit-element/lit-element.js?module';

class SupportDisplay extends LitElement {
  static get properties() {
    return {
      values: {type: Array},
      max: {type: Number},
    }
  }

  constructor() {
    super();
    this.values = [];
    this.opMin = 0.6;
    this.opMax = 0;
  }

  render() {
    return html`
      <style>
        :host {
          background-color: aqua;
          border: solid 1px black;
          border-right: none;
          display: inline-flex;
          height: 20px;
          width: 60px;
        }
        :host > div {
          align-items: center;
          border-right: solid 1px black;
          display: flex;
          flex: 1;
          height: 100%;
          justify-content: center;
        }
      </style>

      ${this.values.map(value => html`
        <div ?max=${value === -1}
          style="background-color: rgba(0, 0, 0, ${this.opMin + (this.opMax - this.opMin) * value / this.max}">
          ${value}
        </div>
      `)}
    `    
  }
}

customElements.define('support-display', SupportDisplay);
