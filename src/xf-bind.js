import {LitElement, html, css} from 'lit-element';

import fx from '../output/fontoxpath.js';
import evaluateXPathToBoolean from '../output/fontoxpath.js';
import evaluateXPathToString from '../output/fontoxpath.js';
import evaluateXPathToFirstNode from '../output/fontoxpath.js';
import evaluateXPath from '../output/fontoxpath.js';

export class XfBind extends LitElement {

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
                type:String
            },
            ref: {
                type: String
            },
            readonly: {
                type: String
            },
            required: {
                type: String
            },
            relevant: {
                type: String
            },
            constraint: {
                type: String
            },
            type: {
                type: String
            },
            calculate: {
                type: String
            },
            nodeset: {
                type: Array
            },
            model:{
                type:Object
            },
            contextNode:{
                type:Object
            }
        };
    }

    constructor() {
        super();
        this.id='';
        this.ref = '';
        this.readonly = 'false()';
        this.required = 'false()';
        this.relevant = 'true()';
        this.constraint = 'true()';
        this.type = 'xs:string';
        this.calculate = '';
        this.nodeset = [];
        this.model = {};
        this.contextNode = {};
    }

    render() {
        return html`
             <slot></slot>
        `;
    }

    firstUpdated(_changedProperties) {
        super.firstUpdated(_changedProperties);
    }

    init(model,refNodes) {
        console.log('BIND::init ', this);
        // console.log('BIND::initialize nodes ', refNodes);

        this.model = model;
        this.nodeset = refNodes;

        this._createModelItems();
    }


    evalXPath(xpath) {

        console.log('eval: ', xpath);
        // console.log('eval: ', fx.evaluateXPathToString(xpath, this.defaultinstance, null, {}));
        return fx.evaluateXPathToString(xpath, this.nodeset, null, {});
    }

    _createModelItems(){
        // console.log('#### ', this.nodeset);

        //single node or array?
        if(Array.isArray(this.nodeset)){
            // todo - iterate and create
            console.log('#### ', this.nodeset);
        }else{
            this._createModelItem(this.nodeset);
        }

    }

    _createModelItem(node){
        // console.log('_createModelItem ', this.nodeset);
        // console.log('_createModelItem ', this.nodeset.nodeType);
        // console.log('_createModelItem model', this.model);


        let value = null;
        switch (this.nodeset.nodeType) {
            case Node.ELEMENT_NODE:
                value = this.nodeset.textContent;
                 break;
            case Node.TEXT_NODE:
                value = this.nodeset.nodeValue;
                break;
            case Node.ATTRIBUTE_NODE:
                value = this.nodeset.nodeValue;
                break;
            default:
                value = ''
        }

        const ro = fx.evaluateXPath(this.readonly, this.nodeset, null, {});
        const req = fx.evaluateXPath(this.required, this.nodeset, null, {});
        const relevant = fx.evaluateXPath(this.relevant, this.nodeset, null, {});
        const valid = fx.evaluateXPath(this.constraint, this.nodeset, null, {});


        const modelItem = {
            value: value,
            readonly:ro,
            required:req,
            relevant: relevant,
            valid:valid,
            type: this.type
        };

        this.model.registerBinding(this.nodeset, modelItem);
    }

}

customElements.define('xf-bind', XfBind);