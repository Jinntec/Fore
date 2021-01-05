import { html, css} from 'lit-element';

import XfAbstractControl from './xf-abstract-control.js';

export class XfAlert extends XfAbstractControl {

    static get styles() {
        return css`
            :host {
                display: block;
                height:auto;
                font-size:0.8em;
                font-weight:400;
                color:red;
                display:none;
            }
        `;
    }

    static get properties() {
        return {
            ...super.properties
        };
    }


    render() {
        return html`
            <slot></slot>
        `;
    }

    isRequired () {
        return false;
    }

    isReadonly (){
        return true;
    }

    handleRequired(mi) {
    }

    handleReadonly() {
        // super.handleReadonly();
    }


}
customElements.define('xf-alert', XfAlert);