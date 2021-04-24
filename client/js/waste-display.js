import {LitElement, html} from 'https://unpkg.com/lit-element/lit-element.js?module';

class WasteDisplay extends LitElement {
  static get properties() {
    return {
      values: {type: Array},
      showTotal: {type: Boolean},
    }
  }

  constructor() {
    super();
    this.values = [];
    this.showTotal = false;
  }

  render() {
    return html`
      <style>
        :host {
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
        [w0] {
          background-color: cornflowerblue;
        }
        [w1] {
          background-color: limegreen;
        }
        [w2] {
          background-color: yellow;
        }
        [op] {
          opacity: 0.5;
        }
        [empty] {
          background-color: orangered;
        }
      </style>

      ${this.values.map((value, i) => html`
        <div ?w0=${i === 0} ?w1=${i === 1} ?w2=${i === 2} ?op=${value === 0} ?empty=${value === -1}>
          ${value >= 0 ? html `${value}` : html`<b>SOL</b>`}
        </div>
      `)}
      ${this.showTotal ? html`
        <div>
          ${this.values.reduce((a, b) => a + b)}
        </div>
      ` : html``}
    `    
  }
}

customElements.define('waste-display', WasteDisplay);
