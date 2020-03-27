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

    init(model){
        this.model = model;

        console.log('init binding ', this);
        if(this.parentNode.nodeName === 'XF-MODEL'){
            this.nodeset = fx.evaluateXPath(this.ref, model.getDefaultInstanceData(), null, {});
        }else{
            console.log('parent nodeset ', this.parentNode.nodeset);

            const parentContext = this.parentNode.nodeset;
            if(Array.isArray(parentContext)){
                parentContext.forEach((n,index) => {
                    console.log('parent item ', n, index);
                    const local = fx.evaluateXPath(this.ref, n, null, {});
                    this.nodeset.push(local);
                });
            }else{
                this.nodeset = fx.evaluateXPath(this.ref, this.parentNode.nodeset, null, {});
            }

        }
        this._createModelItems();

        // ### process child bindings
        const childbinds = this.querySelectorAll('xf-bind');
        Array.from(childbinds).forEach(bind =>{
            console.log('init child bind ', bind);
            bind.init(model);
        });

    }


    evalXPath(xpath) {
        // console.log('eval: ', xpath);
        // console.log('eval: ', fx.evaluateXPathToString(xpath, this.defaultinstance, null, {}));
        return fx.evaluateXPathToString(xpath, this.nodeset, null, {});
    }

    _createModelItems(){
        // console.log('#### ', this.nodeset);

        //single node or array?
        if(Array.isArray(this.nodeset)){
            // todo - iterate and create
            console.log('################################################ ', this.nodeset);
            Array.from(this.nodeset).forEach((n, index) => {
                console.log('>>>> a node ', n, index);
                this._createModelItem(n);

            });
        }else{
            this._createModelItem(this.nodeset);
        }

    }

    _createModelItem(node){
        // console.log('_createModelItem ', this.nodeset);
        // console.log('_createModelItem ', this.nodeset.nodeType);
        // console.log('_createModelItem model', this.model);


        let value = null;
        switch (node.nodeType) {
            case Node.ELEMENT_NODE:
                value = node.textContent;
                 break;
            case Node.TEXT_NODE:
                // value = this.nodeset.nodeValue;
                break;
            case Node.ATTRIBUTE_NODE:
                value = node.nodeValue;
                break;
            default:
                value = node;
        }
/*
        if(this.nodeset.nodeType === Node.ELEMENT_NODE){
            value = this.nodeset.textContent;
        }else{
            value = this.nodeset;
        }
*/

        const ro = fx.evaluateXPath(this.readonly, node, null, {});
        const req = fx.evaluateXPath(this.required, node, null, {});
        const relevant = fx.evaluateXPath(this.relevant, node, null, {});
        const valid = fx.evaluateXPath(this.constraint, node, null, {});


        const modelItem = {
            value: value,
            readonly:ro,
            required:req,
            relevant: relevant,
            valid:valid,
            type: this.type
        };

        this.model.registerBinding(node, modelItem);
    }

}

customElements.define('xf-bind', XfBind);