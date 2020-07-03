import {LitElement, html, css} from 'lit-element';

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
/*
            ref:{
                type: String
            },
*/
            value:{
                type: String
            }
        };
    }

    constructor() {
        super();
        this.value='';
        this.model='';

    }

    render() {
        return html`
            <span>${this.value}</span>
        `;
    }

    firstUpdated(_changedProperties) {
        console.log('firstUpdated')
    }

    refresh() {
        super.refresh();
        this.value = this.getValue();
    }


}
customElements.define('xf-output', XfOutput);