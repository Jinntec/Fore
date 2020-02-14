import {LitElement, html, css} from 'lit-element';

import fx from '../output/fontoxpath.js';
import evaluateXPathToBoolean from '../output/fontoxpath.js';
import evaluateXPathToString from '../output/fontoxpath.js';
import evaluateXPathToFirstNode from '../output/fontoxpath.js';
import evaluateXPath from '../output/fontoxpath.js';

export class XfInstance extends LitElement {

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
            :host:before{
                content:'xf-instance';
            }
        `;
    }

    static get properties() {
        return {
            id:{
                type: String
            },
            instanceData:{
                type: Object
            }
        };
    }

    constructor() {
        super();
        this.id = 'default';
    }

    render() {
        return html`
            <span>${this.id}</span>
            <pre contenteditable="true">
                 <slot></slot>
            </pre>
        `;
    }

    firstUpdated(_changedProperties) {
        console.log('INSTANCE.firstUpdated ', this.id);
        // super.firstUpdated(_changedProperties);



/*
        const documentNode = new DOMParser().parseFromString('<xml/>', 'text/xml');

        console.log(fx.evaluateXPathToString('$foo', null, null, {'foo': 'bar'}));
        // Outputs: "bar"

        // We pass the documentNode so the default INodesFactory can be used.
        console.log(fx.evaluateXPathToFirstNode('<foo>bar</foo>', documentNode, null, null, {language: fx.evaluateXPath.XQUERY_3_1_LANGUAGE}).outerHTML);
*/
    }

    init(){
        // console.log('INSTANCE.init', this.id);
        const instanceData = new DOMParser().parseFromString(this.innerHTML,'text/xml');
        this.instanceData = instanceData;
        console.log('xf-instance data ', this.instanceData);
        // console.log('has greeting ', fx.evaluateXPathToBoolean('exists(//greeting)', this.defaultinstance));
        // this.dispatchEvent(new CustomEvent('instance-ready', {composed: true, bubbles: true, detail: {id:this.id}}));
    }

    evalXPath(xpath){
        console.log('eval: ', xpath);
        // console.log('eval: ', fx.evaluateXPathToString(xpath, this.defaultinstance, null, {}));
        const result = fx.evaluateXPath(xpath, this._getDefaultContext(), null, {});
        return result;
    }

    _getDefaultContext(){
        return this.instanceData.firstElementChild;
    }


}
customElements.define('xf-instance', XfInstance);