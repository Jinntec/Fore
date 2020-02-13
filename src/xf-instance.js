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
                background:yellow;
            }
        `;
    }

    static get properties() {
        return {
            id:{
                type: String
            },
            defaultinstance:{
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
        this.defaultinstance = instanceData;
        console.log('xf-instance data ', this.defaultinstance);
        // console.log('has greeting ', fx.evaluateXPathToBoolean('exists(//greeting)', this.defaultinstance));
        this.dispatchEvent(new CustomEvent('instance-ready', {composed: true, bubbles: true, detail: {id:this.id}}));
    }

/*
    evalXPath(xpath){

        console.log('eval: ', xpath);
        // console.log('eval: ', fx.evaluateXPathToString(xpath, this.defaultinstance, null, {}));
        return fx.evaluateXPathToString(xpath, this.defaultinstance, null, {});
    }
*/


}
customElements.define('xf-instance', XfInstance);