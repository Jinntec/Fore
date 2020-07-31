import { html, css} from 'lit-element';

import XfAbstractControl from './xf-abstract-control.js';

export class XfOutput extends XfAbstractControl {

    static get styles() {
        return css`
            :host {
                display: inline;
                height:auto;
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
            <span id="control">${this.value}</span>
        `;
    }

/*
    getControlValue() {
        // super.getControlValue();
        console.log('output control value ', this.value);
        // console.log('output control value ', this.getValue());
        return this.shadowRoot.querySelector('#control');
        // return this.value;
    }
*/

    isRequired() {
        console.log('Output isrequired');
        return false;
    }

    isReadonly(){
        return true;
    }

    handleRequired(mi) {
        return;
    }


}
customElements.define('xf-output', XfOutput);