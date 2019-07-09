import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';
import {parseTpl} from './StringTpl.js';

/**
 * `xf-message`
 * general class for bound elements
 *
 * todo: implementation and demo
 *
 * @customElement
 * @polymer
 */
class XfMessage extends PolymerElement {

    static get template() {
        return html`
          <style>
            :host {
              display: none;
            }
          </style>
        `;
    }

    static get properties() {
        return {
            bind: {
                type: String
            },
            repeat: {
                type: String
            },
            event: {
                type: String
            },
            level: {
                type: String,
                value: 'ephemeral'
            },
            id: {
                type: String
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('### xf-message connected ', this);
        this.parentNode.addEventListener(this.event, e => this.execute(e));
        this.id = "foobar";
    }

    execute(e) {
        console.log('xf-message.execute ', e.detail);
        console.log('xf-message.execute textContent: ', this.textContent);

        const details = e.detail;
        let tmpl = this.textContent;

        const result = parseTpl(this.textContent, details);
        console.log('result: ', result);

        // this.closest('xf-form').message(e.detail, result, this.level);

        this.dispatchEvent(new CustomEvent('message', {
            composed: true, bubbles: true,
            detail: {'level': this.level, 'message':result}
        }));

    }

}

window.customElements.define('xf-message', XfMessage);
