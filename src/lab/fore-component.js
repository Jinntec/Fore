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
          <fx-fore>
            <fx-message event="ready">hey from component</fx-message>
                <fx-model>
                    <fx-instance>
                        <data>
                            <greeting>Hello Universe</greeting>
                        </data>
                    </fx-instance>
                </fx-model>

                <div class="static {greeting}">Greeting: {greeting}</div>
                <fx-control ref="greeting" update-event="input">
                    <label>Hey!</label>
                </fx-control>
<!--                <slot></slot>-->
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
