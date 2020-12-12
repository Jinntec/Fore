// import {LitElement, html, css} from 'lit-element';

import * as fx from 'fontoxpath';
import {ModelItem} from "./modelitem";
import {ForeElement} from "./ForeElement";

export class XfInstance extends HTMLElement {

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
        this.src = '';
        this.model = this.parentNode;
    }

    connectedCallback(){
        if(this.hasAttribute('id')){
            this.id = this.getAttribute('id');
        }else{
            this.id = 'default';
        }
        // this.id = this.getAttribute('id');
    }

    render() {
        return html`
            <slot></slot>
        `;
    }


/*
    firstUpdated(_changedProperties) {
        console.log("firstupdated instance");
    }
*/

    init (){
        // console.log('xf-instance init');

        const loadedPromise = new Promise(((resolve,reject) => {
            // setTimeout(() => resolve("done"), 2000);

            if(this.src === '#querystring' ){
                const query = new URLSearchParams(location.search);
                console.log('query', query);

                // let instanceData = document.createDocument();
                let instanceData = document.implementation.createDocument(null,'data','xml');
                console.log('new doc ', instanceData);

                // const root = document.createElement('data');
                // instanceData.appendChild(root);
                for(const p of query){
                    let n = document.createElement(p[0]);
                    n.appendChild(document.createTextNode(p[1]));
                    instanceData.documentElement.appendChild(n);
                }

                this.instanceData = instanceData;
                this.instanceData.firstElementChild.setAttribute('id',this.id);

                // this.instanceData.firstElementChild.setAttribute('id',this.id);
                // console.log('created instance from queryString ', this.instanceData);
                // console.log('created instance from queryString ', this.instanceData);


                // const result = fx.evaluateXPathToFirstNode('param1', instanceData.childNodes[0], null, {});
                // console.log(">>>>>result ", result)

            }else if(this.childNodes.length !== 0){
                // setTimeout(() => resolve("done"), 2000);
                // var foo = this;
                // setTimeout(function(){
                //     foo._useInlineData();
                //     resolve("done");
                // },10000);

                this._useInlineData();
                resolve("done");
            }
        }));

        return loadedPromise;


/*
        if(this.src === '#querystring' ){
            const query = new URLSearchParams(location.search);
            console.log('query', query);

            // let instanceData = document.createDocument();
            let instanceData = document.implementation.createDocument(null,'data','xml');
            console.log('new doc ', instanceData);

            // const root = document.createElement('data');
            // instanceData.appendChild(root);
            for(const p of query){
                let n = document.createElement(p[0]);
                n.appendChild(document.createTextNode(p[1]));
                instanceData.documentElement.appendChild(n);
            }

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
*/

        // this.shadowRoot.getElementById('data').appendChild(this.instanceData.cloneNode(true));
    }

    evalXPath(xpath){
        // console.log('eval: ', xpath);
        // console.log('eval: ', fx.evaluateXPathToString(xpath, this.defaultinstance, null, {}));
        // const result = fx.evaluateXPathToFirstNode(xpath, this.getDefaultContext(), null, {});

        // console.log('evalXPath ', xpath);
        // console.log('evalXPath default instance data', this.instanceData);
        // console.log('evalXPath default instance data first', this.instanceData.firstElementChild);

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

    _useInlineData(){
        // console.log('innerText ', this.innerHTML.toString());
        const instanceData = new DOMParser().parseFromString(this.innerHTML,'application/xml');

        // console.log('created instanceData ', new XMLSerializer().serializeToString(instanceData));
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