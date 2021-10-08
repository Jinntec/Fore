import {foreElementMixin} from "./ForeElementMixin.js";

export class FxHeader extends foreElementMixin(HTMLElement){
  static get styles() {
    return css`
      :host {
        display: block;
        height: auto;
        font-size: 0.8em;
        font-weight: 400;
        color: red;
        display: none;
      }
    `;
  }

  constructor() {
    super();
    this.style.display = 'none';
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = ``;

    if(!this.hasAttribute('name')){
      throw new Error('required attribute "name" missing');
    }
    this.name = this.getAttribute('name');

  }

  connectedCallback() {
    this.shadowRoot.innerHTML = ``;
  }


}
customElements.define('fx-header', FxHeader);
