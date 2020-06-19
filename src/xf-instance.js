import {LitElement, html, css} from 'lit-element';

import fx from '../output/fontoxpath.js';
import evaluateXPathToBoolean from '../output/fontoxpath.js';
import evaluateXPathToString from '../output/fontoxpath.js';
import evaluateXPathToFirstNode from '../output/fontoxpath.js';
import evaluateXPathToNodes from '../output/fontoxpath.js';
import evaluateXPath from '../output/fontoxpath.js';

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

    render() {
        return html`
            <span>${this.id}</span>
            <pre contenteditable="true">
                 <slot></slot>
            </pre>
        `;
    }

    init(){
        // console.log('INSTANCE::id ', this.id);
        const instanceData = new DOMParser().parseFromString(this.innerHTML,'text/xml');
        this.instanceData = instanceData;
        // console.log('xf-instance data ', this.instanceData);
    }

    evalXPath(xpath){
        console.log('eval: ', xpath);
        // console.log('eval: ', fx.evaluateXPathToString(xpath, this.defaultinstance, null, {}));
        const result = fx.evaluateXPath(xpath, this.getDefaultContext(), null, {});
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
        return this.instanceData.firstElementChild;
    }


}
customElements.define('xf-instance', XfInstance);