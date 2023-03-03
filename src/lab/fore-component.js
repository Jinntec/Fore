import '../../index.js';

/**
 * a simple component that wraps a Fore page and puts it into shadowDom.
 */
export class ForeComponent extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'})
        this.src = ''
    }

    connectedCallback() {
        this.src= this.getAttribute('src');
        const style = `
          :host {
            display:block;
          }
        `;

        const html = `
          <fx-fore src="${this.src}"></fx-fore>
          <slot></slot>
        `;

        this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${html}
        `;

        const slot = this.shadowRoot.querySelector('slot');
        slot.addEventListener('slotchange', async event => {
            const children = event.target.assignedElements();
            const hostedStylesheet = children.filter(
                linkElem => linkElem.nodeName.toUpperCase() === 'LINK',
            );
            if(!hostedStylesheet) return;
            const allCSS = [...document.styleSheets]
                .map((styleSheet) => {
                    if(hostedStylesheet.find(sh => sh.href === styleSheet.href)){
                    // if(styleSheet.ownerNode.hasAttribute('data-shadow')){
                        console.log('doc style', styleSheet);
                        try {
                            return [...styleSheet.cssRules]
                                .map((rule) => rule.cssText)
                                .join('');
                        } catch (e) {
                            console.log('Access to stylesheet %s is denied. Ignoring…', styleSheet.href);
                        }
                    }
                })
                .filter(Boolean)
                .join('\n');

            const sheet = new CSSStyleSheet();
            sheet.replaceSync(allCSS);
            this.shadowRoot.adoptedStyleSheets = [sheet];
        });


    }

}

if (!customElements.get('fore-component')) {
    customElements.define('fore-component', ForeComponent);
}
