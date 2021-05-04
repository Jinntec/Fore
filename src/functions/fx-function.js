/**
 * Allows to extend a form with local custom functions.
 *
 * ` */
export class FxFunction extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.style.display = 'none';

    this.signature = this.hasAttribute('signature')?this.getAttribute('signature'):null;
    if(this.signature === null){
      console.error('signature is a required attribute');
    }
    this.type = this.hasAttribute('type')?this.getAttribute('type'):null;
    this.shadowRoot.innerHTML = `<slot></slot>`;

    this.override = this.hasAttribute('override')?this.getAttribute('override'):'true'
    this.functionBody = this.innerHTML;
  }


}
customElements.define('fx-function', FxFunction);
