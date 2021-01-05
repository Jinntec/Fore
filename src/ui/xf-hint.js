import { html, css} from 'lit-element';

import XfAbstractControl from './xf-abstract-control.js';

export class XfHint extends XfAbstractControl {

    static get styles() {
        return css`
            :host {
                display: block;
                height:auto;
                font-size:0.8em;
                font-weight:400;
                font-style:italic;
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
customElements.define('xf-hint', XfHint);