import '../../index.js';
// import '@jinntec/jinn-codemirror/src/jinn-code-mirror.js';

/**
 * a simple component that wraps a Fore page and puts it into shadowDom.
 *
 * HTML link elements passed as children will be used to construct a CSSStyleSheet that is passed
 * to the shadowDOM.
 * @customElement
 */
export class InstanceInspector extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.id = this.getAttribute('id');
    const style = `
          :host {
            display:block;
            background:blue;           
          }
          section, fx-control, jinn-codemirror{
            display:block;
            width:100%;
            height:100%;
          }
        `;
    const html = `
        <section>
            <fx-control ref="instance('${this.id}')" as="node">
                <label>${this.id}</label>
                <jinn-codemirror mode="xml" class="widget"></jinn-codemirror>
            </fx-control>
        </section>
        <slot></slot>
        `;

    this.innerHTML = `
            <style>
                ${style}
            </style>
            ${html}
        `;

    this.closest('fx-fore').refresh();
  }
}

if (!customElements.get('instance-inspector')) {
  customElements.define('instance-inspector', InstanceInspector);
}
