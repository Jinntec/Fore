import {html, PolymerElement} from '../assets/@polymer/polymer/polymer-element.js';


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
          <slot> </slot>
        `;
    }

    static get properties() {
        return {
            bind: {
                type: String
            },
            repeat:{
                type: String
            },
            event:{
                type: String
            },
            sticky:{
                type: Boolean,
                value:false
            },
            level:{
                type: String
            }
        };
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('### xf-message connected ', this);
        this.parentNode.addEventListener(this.event, this.execute.bind(this));
    }

    execute(e){
        // console.log('xf-message.execute ', this);
        console.log('xf-message.execute ', this.textContent);
        this.closest('xf-form').message(this.textContent, this.level);
    }

}

window.customElements.define('xf-message', XfMessage);
