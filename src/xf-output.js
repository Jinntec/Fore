import {LitElement, html, css} from 'lit-element';

import fx from '../output/fontoxpath.js';
import evaluateXPathToBoolean from '../output/fontoxpath.js';
import evaluateXPathToString from '../output/fontoxpath.js';
import evaluateXPathToFirstNode from '../output/fontoxpath.js';
import evaluateXPath from '../output/fontoxpath.js';
import {BoundElement} from "./BoundElement";

export class XfOutput extends BoundElement {

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
        this.ref='';
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