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
            ref:{
                type: String
            },
            value:{
                type: String
            }
        };
    }

    constructor() {
        super();
        this.ref='';
        this.model='';
    }

    render() {
        return html`
            <span>${this.value}</span>
        `;
    }



}
customElements.define('xf-output', XfOutput);