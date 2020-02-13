import {LitElement, html, css} from 'lit-element';

import fx from '../output/fontoxpath.js';
import evaluateXPathToBoolean from '../output/fontoxpath.js';
import evaluateXPathToString from '../output/fontoxpath.js';
import evaluateXPathToFirstNode from '../output/fontoxpath.js';
import evaluateXPath from '../output/fontoxpath.js';

export class XfBind extends LitElement {

    static get styles() {
        return css`
            :host {
                display: block;
                height:auto;
                background:orange;
            }
        `;
    }

    static get properties() {
        return {
            ref:{
                type: String
            },
            readonly:{
                type:String
            },
            required:{
                type: String
            },
            relevant:{
                type: String
            },
            constraint:{
                type: String
            },
            type:{
                type: String
            },
            calculate:{
                type: String
            }
        };
    }

    constructor() {
        super();
        this.ref='';
        this.readonly = 'false()';
        this.required = 'false()';
        this.relevant = 'true()';
        this.constraint = 'true()';
        this.type = 'xs:string';
        this.calculate = '';
    }

    render() {
        return html`
             ref: ${this.ref}
             readonly: ${this.readonly}
             required: ${this.required}
             relevant: ${this.relevant}
             type: ${this.type}
             calculate: ${this.calculate}
             <slot></slot>
        `;
    }

    firstUpdated(_changedProperties) {
        super.firstUpdated(_changedProperties);
    }

    evalXPath(xpath){

        console.log('eval: ', xpath);
        // console.log('eval: ', fx.evaluateXPathToString(xpath, this.defaultinstance, null, {}));
        return fx.evaluateXPathToString(xpath, this.defaultinstance, null, {});
    }


}
customElements.define('xf-bind', XfBind);