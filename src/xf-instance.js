import {LitElement, html, css} from 'lit-element';

import fx from './output/fontoxpath.js';
import evaluateXPathToBoolean from './output/fontoxpath.js';
import evaluateXPathToString from './output/fontoxpath.js';
import evaluateXPathToFirstNode from './output/fontoxpath.js';
import evaluateXPathToNodes from './output/fontoxpath.js';
import evaluateXPath from './output/fontoxpath.js';

export class XfInstance extends LitElement {

    static get styles() {
        return css`
            :host {
                display: none;
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

/*
    render() {
        return html`
            <span>${this.id}</span>
            <pre contenteditable="true">
                 <slot></slot>
            </pre>
        `;
    }
*/

    init(){
        // console.log('INSTANCE::id ', this.id);
        const instanceData = new DOMParser().parseFromString(this.innerHTML,'application/xml');

        // console.log('created instanceData ', new XMLSerializer(instanceData));
        // console.log('namespace ', instanceData.firstElementChild.namespaceURI);

        console.log('xf-instance init id:', this.id);
        this.instanceData = instanceData;
        // console.log('instanceData ', this.instanceData);
        // console.log('instanceData ', this.instanceData.firstElementChild);


        // this.shadowRoot.appendChild(this.instanceData.firstElementChild);

        console.log('xf-instance data: ', this.instanceData);
        this.instanceData.firstElementChild.setAttribute('id',this.id);
        // console.log('xf-instance data ', this.instanceData);
    }

    evalXPath(xpath){
        // console.log('eval: ', xpath);
        // console.log('eval: ', fx.evaluateXPathToString(xpath, this.defaultinstance, null, {}));
        const result = fx.evaluateXPathToFirstNode(xpath, this.getDefaultContext(), null, {});
        return result;
    }

    setValue(path, newValue){
        const updateExpr = 'replace value of node ' + path + ' with "' + newValue + '"';
        console.log('instance updateExpr: ', updateExpr);
        fx.evaluateUpdatingExpression(updateExpr, this.instanceData)
        .then(result => {
            fx.executePendingUpdateList(result.pendingUpdateList);
        });

    }

    getInstanceData(){
        return this.instanceData;
    }

    getDefaultContext(){
        // console.log('getDefaultContext ', this.instanceData.firstElementChild);
        return this.instanceData.firstElementChild;
    }


}
customElements.define('xf-instance', XfInstance);