import '@polymer/iron-ajax/iron-ajax.js';

import * as fx from 'fontoxpath';

export class XfInstance extends HTMLElement {

    constructor() {
        super();

        this.model = this.parentNode;

        this.attachShadow({mode:'open'});

    }

    connectedCallback(){
        // console.log('connectedCallback ', this);
        if(this.hasAttribute('src')){
            this.src=this.getAttribute('src');
        }
        // this.src = '';

        if(this.hasAttribute('id')){
            this.id = this.getAttribute('id');
        }else{
            this.id = 'default';
        }

        if(this.hasAttribute('type')){
            this.type = this.getAttribute('type');
        }else {
            this.type = 'xml';
        }
        const style = `
            :host {
                display: none;
            }
        `;

        const html = `
           <slot></slot>
           <iron-ajax 
                id="loader"
                url="${this.src}"
                method="GET"
                handle-as="text"
                with-credentials></iron-ajax>
        `;
        this.shadowRoot.innerHTML = `
            <style>
                ${style}
            </style>
            ${html}
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
        return this;
        // this.shadowRoot.getElementById('data').appendChild(this.instanceData.cloneNode(true));
    }

    evalXPath(xpath){
        const result = fx.evaluateXPathToFirstNode(xpath, this.getDefaultContext(), null, {});
        return result;
    }


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
                // console.log('query', query);

                const doc = new DOMParser().parseFromString('<data></data>','application/xml');
                const root = doc.firstElementChild;
                for(const p of query){
                    const newNode = doc.createElement(p[0]);
                    newNode.appendChild(doc.createTextNode(p[1]));
                    root.appendChild(newNode);
                }

                this.instanceData = doc;
                this.instanceData.firstElementChild.setAttribute('id',this.id);

                // const data = new XMLSerializer().serializeToString(this.instanceData);
                // console.log('instance from querystring ' , data);

                resolve("done");
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