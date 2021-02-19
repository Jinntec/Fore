import { html, css} from 'lit-element';

import XfAbstractControl from './xf-abstract-control.js';

export class XfOutput extends XfAbstractControl {

    static get styles() {
        return css`
            :host {
                display: inline-block;
                height:auto;
                width:100%;
            }
            #control{
                display:inline-block;
                width:100%;
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

    firstUpdated(_changedProperties) {
        super.firstUpdated(_changedProperties);
        if(this.querySelector('xf-label')){
            this.style.display = 'block';
        }
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

    isRequired () {
        console.log('Output required');
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
customElements.define('xf-output', XfOutput);