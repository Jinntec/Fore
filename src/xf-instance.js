import {LitElement, html, css} from 'lit-element';

import fx from './output/fontoxpath.js';
import evaluateXPathToBoolean from './output/fontoxpath.js';
import evaluateXPathToString from './output/fontoxpath.js';
import evaluateXPathToFirstNode from './output/fontoxpath.js';
import evaluateXPathToNodes from './output/fontoxpath.js';
import evaluateXPath from './output/fontoxpath.js';
import {ModelItem} from "./modelitem";

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
            },
            src:{
                type: String
            },
            model:{
                type:Object
            }
        };
    }

    constructor() {
        super();
        this.id = 'default';
        this.instanceData = {};
        this.src = '';
        this.model = this.parentNode;
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

        if(this.src === '#querystring' ){
            const query = new URLSearchParams(location.search);

            const instanceData = new DOMParser().parseFromString('<data></data>','application/xml');

            for(const p of query){
                let n = document.createElement(p[0]);
                n.appendChild(document.createTextNode(p[1]));
                instanceData.firstElementChild.appendChild(n);
            };

            this.instanceData = instanceData;
            // this.instanceData.firstElementChild.setAttribute('id',this.id);

            console.log('created instance from queryString ', this.instanceData);
        }else{
            this._useInlineData();
        }
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

    _useInlineData(){
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



}
customElements.define('xf-instance', XfInstance);