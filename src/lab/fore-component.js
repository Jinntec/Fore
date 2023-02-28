import '../../index.js';


export class ForeComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
    }

    connectedCallback() {
        const style = `
          @import '../../resources/fore.css';
          :host {
            display:block;
          }
        `;

        const html = `
          <fx-fore src="/src/lab/template.html">
            </fx-fore>
        `;

        this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${html}
        `;

    }

}

if (!customElements.get('fore-component')) {
    customElements.define('fore-component', ForeComponent);
}
