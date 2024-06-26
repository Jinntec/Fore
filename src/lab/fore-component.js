/**
 * a simple component that wraps a Fore page and puts it into shadowDom.
 *
 * HTML link elements passed as children will be used to construct a CSSStyleSheet that is passed
 * to the shadowDOM.
 * @customElement
 */
export class ForeComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.src = '';
  }

  connectedCallback() {
    this.src = this.getAttribute('src');
    const style = `
          :host {
            display:block;
          }
        `;
    const html = `
          <fx-fore src="${this.src}">
          </fx-fore>
          <slot id="default"></slot>
        `;

    this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${html}
        `;

    /*
     * wait for slotchange, then filter document.stylesheets to construct CSSStyleSheet
     */
    const slot = this.shadowRoot.querySelector('#default');
    slot.addEventListener('slotchange', async event => {
      const children = event.target.assignedElements();
      const hostedStylesheet = children.filter(
        linkElem => linkElem.nodeName.toUpperCase() === 'LINK',
      );
      if (!hostedStylesheet) return;
      const allCSS = [...document.styleSheets]
        .map(styleSheet => {
          if (hostedStylesheet.find(sh => sh.href === styleSheet.href)) {
            try {
              return [...styleSheet.cssRules].map(rule => rule.cssText).join('');
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

    /*
        const eventSlot = this.shadowRoot.querySelector('slot[name="event"]');
        eventSlot.addEventListener('slotchange', async event => {
            const children = event.target.assignedElements();
            console.log('events', children)
        });
*/
    const eventTmpl = this.querySelector('fx-action');
    if (eventTmpl) {
      // const clone = eventTmpl.content.cloneNode(true);
      const clone = eventTmpl.cloneNode(true);
      this.removeChild(eventTmpl);
      // const content = document.importNode(clone, true);

      const fore = this.shadowRoot.querySelector('fx-fore');
      // fore.appendChild(content.firstElementChild);
      fore.appendChild(clone);
    }
  }
}

if (!customElements.get('fore-component')) {
  customElements.define('fore-component', ForeComponent);
}
