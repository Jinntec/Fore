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
                background:var(--paper-blue-500);
                padding:var(--model-element-padding);
                margin-top:var(--model-element-margin);
                margin-bottom:var(--model-element-margin);
            }
            
            :host:before {
                content:'xf-bind';
            }
            
            .info span{
                background: orange;
                border-radius:10px;
                margin-right:10px;
                padding:var(--model-element-padding);
            }
        `;
    }

    static get properties() {
        return {
            id:{
                type:String
            },
            ref: {
                type: String
            },
            readonly: {
                type: String
            },
            required: {
                type: String
            },
            relevant: {
                type: String
            },
            constraint: {
                type: String
            },
            type: {
                type: String
            },
            calculate: {
                type: String
            },
            nodeset: {
                type: Array
            },
            modelItems:{
                type: Array
            }
        };
    }

    constructor() {
        super();
        this.id='';
        this.ref = '';
        this.readonly = 'false()';
        this.required = 'false()';
        this.relevant = 'true()';
        this.constraint = 'true()';
        this.type = 'xs:string';
        this.calculate = '';
        this.nodeset = [];
        this.modelItems = [];
    }

    render() {
        return html`
             <span class="info">
                 <span>id: ${this.id}</span>
                 <span>ref: ${this.ref}</span>
                 <span>readonly: ${this.readonly}</span>
                 <span>required: ${this.required}</span>
                 <span>relevant: ${this.relevant}</span>
                 <span>type: ${this.type}</span>
                 <span>calculate: ${this.calculate}</span>
             </span>
             <slot></slot>
        `;
    }

    firstUpdated(_changedProperties) {
        super.firstUpdated(_changedProperties);
    }

/*
    initialize() {

    }
*/

    evalXPath(xpath) {

        console.log('eval: ', xpath);
        // console.log('eval: ', fx.evaluateXPathToString(xpath, this.defaultinstance, null, {}));
        return fx.evaluateXPathToString(xpath, this.defaultinstance, null, {});
    }

/*
    getInstanceData(){
        return this.closest('xf-model').getDefaultInstanceData();
    }
*/


}

customElements.define('xf-bind', XfBind);