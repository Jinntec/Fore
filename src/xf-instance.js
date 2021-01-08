import {LitElement, html, css} from 'lit-element';
import '../assets/@polymer/iron-ajax/iron-ajax.js';

import * as fx from 'fontoxpath';

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
            },
            /**
             * the type of instance either 'xml' or 'json'. This is reserved for future
             * use and setting 'json' has no effect yet.
             */
            type:{
                type: String
            }
        };
    }

    constructor() {
        super();
        this.src = '';
        this.id = 'default';
        this.model = this.parentNode;
        this.type= 'xml';
    }

/*
    connectedCallback(){
        if(this.hasAttribute('id')){
            this.id = this.getAttribute('id');
        }else{
            this.id = 'default';
        }
        if(this.hasAttribute('type')){
            this.type = this.getAttribute('type');
        }
        // this.id = this.getAttribute('id');
    }
*/

    render() {
        return html`
            ${this.src?
            html`
                <iron-ajax 
                    id="loader"
                    url="${this.src}"
                    method="GET"
                    handle-as="text"
                    with-credentials
                    @error="${this._handleError}"
                ></iron-ajax>
            `:''}
            <slot></slot>
        `;
    }

    async init (){
        // console.log('xf-instance init');
        // if(this.src) return;
        if(this.type === 'xml'){
            await this._initXMLInstance();
        }else{
            this._initJSONInstance();
        }
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
        if(this.type === 'xml'){
            return this.instanceData.firstElementChild;
        }else{
            return this.instanceData;
        }
    }

    _initXMLInstance(){
        const loadedPromise = new Promise(((resolve,reject) => {
            // setTimeout(() => resolve("done"), 2000);

            if(this.src === '#querystring' ){
                const query = new URLSearchParams(location.search);
                console.log('query', query);

                // let instanceData = document.createDocument();
                const instanceData = document.implementation.createDocument(null,'data','xml');
                console.log('new doc ', instanceData);

                // const root = document.createElement('data');
                // instanceData.appendChild(root);
                for(const p of query){
                    const n = document.createElement(p[0]);
                    n.appendChild(document.createTextNode(p[1]));
                    instanceData.documentElement.appendChild(n);
                }

                this.instanceData = instanceData;

                this.instanceData.firstElementChild.setAttribute('id',this.id);
            } else if(this.src){

                const loader = this.shadowRoot.getElementById('loader');
                loader.addEventListener('response',() => {
                    const instanceData = new DOMParser().parseFromString(loader.lastResponse,'application/xml');
                    this.instanceData = instanceData;
                    console.log('xf-instance data: ', this.instanceData);
                    this.dispatchEvent(new CustomEvent('instance-loaded', {}));
                    resolve("done");
                });
                loader.addEventListener('error',() =>{
                    console.log('error while loading data from src: ', loader.lastError);
                    reject();
                });
                loader.generateRequest();

            } else if(this.childNodes.length !== 0){
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
    }

    _initJSONInstance(){
        this.instanceData = JSON.parse(this.textContent);
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

    _handleResponse(){
        console.log('_handleResponse ');
        const ajax = this.shadowRoot.getElementById('loader');
        const instanceData = new DOMParser().parseFromString(ajax.lastResponse,'application/xml');
        this.instanceData = instanceData;
        console.log('data: ', this.instanceData);

    }

    _handleError(){
        const loader = this.shadowRoot.getElementById('loader');
        console.log('_handleResponse ', loader.lastError);

    }


}
customElements.define('xf-instance', XfInstance);