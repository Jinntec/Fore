import {LitElement, html, css} from 'lit-element';

import fx from './output/fontoxpath.js';
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
        // this.instanceData = {};
        this.src = '';
        this.model = this.parentNode;
    }

    render() {
        return html`
            <slot></slot>
        `;
    }


    firstUpdated(_changedProperties) {
        console.log("firstupdated instance");
    }

    init(){
        // console.log('xf-instance init');
        if(this.src === '#querystring' ){
            const query = new URLSearchParams(location.search);
            console.log('query', query);

            // let instanceData = document.createDocument();
            let instanceData = document.implementation.createDocument(null,'data');
            console.log('new doc ', instanceData);

            // const root = document.createElement('data');
            // instanceData.appendChild(root);
            for(const p of query){
                let n = document.createElement(p[0]);
                n.appendChild(document.createTextNode(p[1]));
                instanceData.documentElement.appendChild(n);
            };

            this.instanceData = instanceData;
            this.instanceData.firstElementChild.setAttribute('id',this.id);

            // this.instanceData.firstElementChild.setAttribute('id',this.id);
            // console.log('created instance from queryString ', this.instanceData);
            // console.log('created instance from queryString ', this.instanceData);


            // const result = fx.evaluateXPathToFirstNode('param1', instanceData.childNodes[0], null, {});
            // console.log(">>>>>result ", result)

        }else if(this.childNodes.length !== 0){
            this._useInlineData();
        }

        // this.shadowRoot.getElementById('data').appendChild(this.instanceData.cloneNode(true));
    }

    evalXPath(xpath){
        // console.log('eval: ', xpath);
        // console.log('eval: ', fx.evaluateXPathToString(xpath, this.defaultinstance, null, {}));
        // const result = fx.evaluateXPathToFirstNode(xpath, this.getDefaultContext(), null, {});

        console.log('evalXPath ', xpath);
        console.log('evalXPath default instance data', this.instanceData);
        console.log('evalXPath default instance data first', this.instanceData.firstElementChild);

        // const result = fx.evaluateXPathToFirstNode(xpath, this.instanceData.firstElementChild, null, {});
        const result = fx.evaluateXPathToFirstNode(xpath, this.getDefaultContext(), null, {});
        return result;
    }

/*
    setValue(path, newValue){
        const updateExpr = 'replace value of node ' + path + ' with "' + newValue + '"';
        console.log('instance updateExpr: ', updateExpr);
        fx.evaluateUpdatingExpression(updateExpr, this.instanceData)
        .then(result => {
            fx.executePendingUpdateList(result.pendingUpdateList);
        });

    }
*/

    getInstanceData(){
        return this.instanceData;
    }

    getDefaultContext(){
        // console.log('getDefaultContext ', this.instanceData.firstElementChild);
        return this.instanceData.firstElementChild;
    }


    lazyCreateModelItem(ref,node){
        // console.log('_createModelItem ', this.nodeset);
        // console.log('_createModelItem ', this.nodeset.nodeType);
        // console.log('_createModelItem model', this.model);
        // console.log('_createModelItem node', node);
        // console.log('_createModelItem node', node);
        // console.log('_createModelItem nodeType', node.nodeType);

        let mItem = {};
        let targetNode = {};
        if(node.nodeType === node.TEXT_NODE){
            // const parent = node.parentNode;
            // console.log('PARENT ', parent);
            targetNode = node.parentNode;
        }else {
            targetNode = node;
        }

        const mi = new ModelItem( ref,false,true,false,true,'xs:string',targetNode);
        console.log('new ModelItem is instanceof ModelItem ', mi instanceof ModelItem);
        this.model.registerModelItem(mi);
        return mi;
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

/*
    createRenderRoot() {
        return this;
    }
*/


}
customElements.define('xf-instance', XfInstance);