import { PolymerElement } from '../assets/@polymer/polymer/polymer-element.js';


/**
 * `xf-action`
 * a button triggering Fore actions
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
export class XfAbstractAction extends PolymerElement{

/*
    static get properties() {
        return {
        };
    }
*/

/*
    connectedCallback() {
        super.connectedCallback();
    }
*/

    execute(){
        console.log('### execute ', this);
    }
}

window.customElements.define('xf-action', XfAbstractAction);
