import { PolymerElement } from '../assets/@polymer/polymer/polymer-element.js';
import { BoundElementMixin } from './BoundElementMixin.js';


/**
 * `xf-action`
 * a button triggering Fore actions
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
export class XfAction extends BoundElementMixin(PolymerElement){

/*
    static get properties() {
        return {
        };
    }
*/

    connectedCallback() {
        super.connectedCallback();
        // console.log('xf-action attached');

    }

    init() {
        super.init();
    }

    performAction(e) {
        console.log('performAction ', this);

    }

    dispatchActionPerformed(){
        this.dispatchEvent(new CustomEvent('action-performed', {composed: true, bubbles: true, detail: {}}));

    }
}

window.customElements.define('xf-action', XfAction);
