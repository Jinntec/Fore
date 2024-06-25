import {Fore} from './fore.js';
import {evaluateXPath} from "./xpath-evaluation.js";

/**
 * Decorator for native HTMLDataElement to act as a data container.
 */
export class DataElement {
    static get properties() {
        return {
            id:{
                type:String
            },
            src: {
                type: String,
                attribute: 'data-src'
            },
            type: {
                type: String,
                attribute: 'data-type'
            },
            defaultNs: {
                type: String,
                attribute: 'default-ns'
            }
        };
    }

    constructor(dataElement) {
        this.dataElement = dataElement;
        this.src = this.dataElement.getAttribute('data-src');
        this.type = this.dataElement.hasAttribute('data-type') ? this.dataElement.getAttribute('data-type') : 'xml';
        this.credentials = this.dataElement.hasAttribute('credentials')
            ? this.dataElement.getAttribute('credentials')
            : 'same-origin';
        if (!['same-origin', 'include', 'omit'].includes(this.credentials)) {
            console.error(`fx-submission: the value of credentials is not valid. Expected 'same-origin', 'include' or 'omit' but got '${this.credentials}'`, this);
        }
        this.data = null;
        this.originalData = null;
        this.partialData = null;
    }

    /**
     * initializes data by either loading them externally or using inline data.
     *
     * @returns {Promise<DataElement>}
     */
    async init() {
        await this._initData();
        Fore.dispatch(this, 'data-loaded', {data:this});
        return this;
    }

    /**
     *
     * @returns {Object}
     */
    getData(){
        if(!this.data){
            this._createData();
        }
        return this.data;
    }

    setData(data) {
        if (!data) {
            this._createData();
            return;
        }
        this._setInitialData(data);
    }

    getId(){
        return this.dataElement.hasAttribute('id') ? this.dataElement.getAttribute('id'):'default';
    }

    /**
     * return the default context (root node of respective instance) for XPath evalution.
     *
     * @returns {Document|T|any|Element}
     */
    getDefaultContext() {
        // Note: use the getter here: it might provide us with stubbed data if anything async is racing,
        // such as an @src attribute
        const data = this.getData();
        if (this.type === 'xml') {
            // return data.firstElementChild;
            return data.documentElement;
        }
        return data;
    }

    evalXPath(xpath) {
        const formElement = this.dataElement.parentElement.parentElement;
        const result = evaluateXPath(xpath, this.getDefaultContext(), formElement);
        return result;
    }

    reset(){
        // this._useInlineData();
        this.data = this.originalData.cloneNode(true);
    }

    async _initData() {
        if (this.src) {
            await this._loadData();
        } else if (this.dataElement.childNodes.length !== 0) {
            this._useInlineData();
        }
    }

    _createData() {
        if (this.type === 'xml') {
            const doc = new DOMParser().parseFromString('<data></data>', 'application/xml');
            this.data = doc;
            this.originalData = this.data.cloneNode(true);
        }
        if (this.type === 'json') {
            this.data = {};
            this.originalData = [...this.data];
        }
        if(this.type === 'text'){
            this.data = '';
            this.originalData = '';
        }
    }

    async _loadData() {
        const url = `${this.src}`;
        if (url.startsWith('localStore')) {
            const key = url.substring(url.indexOf(':') + 1);
            const doc = new DOMParser().parseFromString('<data></data>', 'application/xml');
            this.data = doc;

            if (!key) {
                console.warn('no key specified for localStore');
                return;
            }

            const serialized = localStorage.getItem(key);
            if (!serialized) {
                console.warn(`Data for key ${key} cannot be found`);
                this._useInlineData();
                return;
            }
            const data = new DOMParser().parseFromString(serialized, 'application/xml');
            doc.firstElementChild.replaceWith(data.firstElementChild);
            return;
        }

        const contentType = this._getContentType();
        try {
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'same-origin',
                mode: 'cors',
                headers: {
                    'Content-Type': contentType,
                },
            });
            const data = await this.handleResponse(response);
            this._setInitialData(data);
        } catch (error) {
            throw new Error(`failed loading data ${error}`);
        }
    }

    _setInitialData(data) {
        this.data = data;
        if (data.nodeType) {
            this.originalData = this.data.cloneNode(true);
        } else {
            this.originalData    = {...this.data};
        }
    }

    _getContentType() {
        if (this.type === 'xml') {
            return 'application/xml';
        }
        if (this.type === 'json') {
            return 'application/json';
        }
        console.warn('content-type unknown ', this.type);
        return null;
    }

    _useInlineData() {
        if (this.type === 'xml') {
            console.log('outerHTML', this.dataElement.outerHTML);
            const data = new DOMParser().parseFromString(this.dataElement.outerHTML, 'application/xml');
            console.log('parsed as xml', data);

            this._setInitialData(data);
        } else if (this.type === 'json') {
            this._setInitialData(JSON.parse(this.dataElement.textContent));
        } else if (this.type === 'html') {
            this._setInitialData(this.dataElement.firstElementChild.children);
        } else if (this.type === 'text') {
            this._setInitialData(this.dataElement.textContent);
        } else {
            console.warn('unknown type for data ', this.type);
        }
    }

    async handleResponse(response) {
        const {status} = response;
        if (status >= 400) {
            alert(`response status: ${status} - failed to load data for '${this.src}' - stopping.`);
            throw new Error(`failed to load data - status: ${status}`);
        }
        const responseContentType = response.headers.get('content-type').toLowerCase();
        if (responseContentType.startsWith('text/html')) {
            return response.text().then(result =>
                new DOMParser().parseFromString(result, 'text/html')
            );
        }
        if (responseContentType.startsWith('text/')) {
            return response.text();
        }
        if (responseContentType.startsWith('application/json')) {
            return response.json();
        }
        if (responseContentType.startsWith('application/xml') || responseContentType.startsWith('text/xml')) {
            const text = await response.text();
            return new DOMParser().parseFromString(text, 'application/xml');
        }
        throw new Error(`unable to handle response content type: ${responseContentType}`);
    }
};
