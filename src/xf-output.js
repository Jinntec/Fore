import {LitElement, html, css} from 'lit-element';

import fx from '../output/fontoxpath.js';
import evaluateXPathToBoolean from '../output/fontoxpath.js';
import evaluateXPathToString from '../output/fontoxpath.js';
import evaluateXPathToFirstNode from '../output/fontoxpath.js';
import evaluateXPath from '../output/fontoxpath.js';

export class XfOutput extends LitElement {

    static get styles() {
        return css`
            :host {
                display: inline;
                height:auto;
                background:green;
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
    }

    render() {
        return html`
            <span>${this.value}</span>
        `;
    }

    firstUpdated(_changedProperties) {
        super.firstUpdated(_changedProperties);
        // console.log('xf-output ref ', this.ref);

        // this.value = document.querySelector('xf-instance').evalXPath(this.ref);
        // this.requestUpdate();

    }

    defaultInstance(){
        this.defaultInstance = document.querySelector('xf-instance');
        console.log('default instance ', this.defaultInstance);
    }


}
customElements.define('xf-output', XfOutput);