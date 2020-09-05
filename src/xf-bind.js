import {LitElement, html, css} from 'lit-element';
import {ModelItem} from './modelitem.js';

/*
import {
    evaluateXPath,
    evaluateXPathToFirstNode,
    registerCustomXPathFunction } from 'fontoxpath';
*/

import fx from './output/fontoxpath.js';
import evaluateXPathToFirstNode from './output/fontoxpath.js';
import evaluateXPath from './output/fontoxpath.js';
import registerCustomXPathFunction from './output/fontoxpath.js';


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
        this.inited = false;
    }

    render() {
        return html`
             <slot></slot>
        `;
    }

    firstUpdated(_changedProperties) {
        super.firstUpdated(_changedProperties);


    }

    namespaceResolver(prefix) {
        console.log('namespaceResolver  prefix', prefix);
        var ns = {
            'xhtml' : 'http://www.w3.org/1999/xhtml',
        };
        return ns[prefix] || null;
        // return null;
    }


    init(model){
        this.model = model;

        //if no ref use
        // a. the nodeset of your parent bind
        // b. if no parent use default context


        console.log('init binding ', this);
        if(this.parentNode.nodeName === 'XF-MODEL'){
            /*
            * if we have an outermost bind having model as parent the default instance data are used as context.
            */
            this.nodeset = fx.evaluateXPath(this.ref, model.getDefaultContext(), null, {namespaceResolver: this.namespaceResolver});
            // this.nodeset = this.model.getDefaultInstance().evalXPath(this.ref);

        }else{
            // console.log('parent nodeset ', this.parentNode.nodeset);

            const parentContext = this.parentNode.nodeset;
            if(Array.isArray(parentContext)){
                parentContext.forEach((n,index) => {
                    // console.log('parent item ', n, index);
                    if(this.ref !== './text()'
                        && this.ref !== 'text()'
                    ){
                        const local = fx.evaluateXPathToFirstNode(this.ref, n, null, {namespaceResolver:  this.namespaceResolver});
                        // console.log('>>>>>>>>>>< local: ', local);

                        // console.log('local type ', local.nodeType);
                        this.nodeset.push(local);
                    }else{
                        this.nodeset = parentContext;
                    }
                });

            }else{
                this.nodeset = fx.evaluateXPathToFirstNode(this.ref, this.parentNode.nodeset, null, {namespaceResolver: this.namespaceResolver});
            }

        }

        // console.log('model namespace ', this.model.isDefaultNamespace(""));
        // console.log('model namespace ', this.model.lookupNamespaceURI(""));
        // console.log('nodeset ', this.nodeset);

        // let result = fx.evaluateXPath('Q{xf}instance("second")',this.nodeset,null,{});
        // console.log('????? result ',result);

        // result = fx.evaluateXPath('Q{xf}instance("second")//outro',this.nodeset,null,null,null, {namespaceResolver: this.namespaceResolver});
        // result = fx.evaluateXPath('Q{xf}instance("second")/outro',this.nodeset,null,null,null, {});
        // console.log('????? result ',result);


        console.log('bound nodeset ', this.nodeset);

        this._createModelItems();

        // ### process child bindings
        const childbinds = this.querySelectorAll('xf-bind');
        Array.from(childbinds).forEach(bind =>{
            // console.log('init child bind ', bind);
            bind.init(model);
        });

    }


    evalXPath(xpath) {
        // console.log('eval: ', xpath);
        // console.log('eval: ', fx.evaluateXPathToString(xpath, this.defaultinstance, null, {}));
        return fx.evaluateXPathToString(xpath, this.nodeset, null, {});
    }

    _createModelItems(){
        // console.log('#### ', thi+s.nodeset);

        //single node or array?
        if(this.ref === '.' || this.ref==='./text()' || this.ref ==='text()'){
            //todo: update parent modelItem
            return;
        }
        if(Array.isArray(this.nodeset)){
            // todo - iterate and create
            // console.log('################################################ ', this.nodeset);
            Array.from(this.nodeset).forEach((n, index) => {
                // console.log('node ',n);
                this._createModelItem(n);

            });
        }else{
            this._createModelItem(this.nodeset);
        }

    }


    /**
     * creates a ModelItem for given instance node.
     *
     * Please note that for textnode no ModelItem is created but instead the one of its parent is used which either
     * must exist and be initialized already when we hit the textnode.
     * @param node
     * @private
     */
    _createModelItem(node){
        // console.log('_createModelItem ', this.nodeset);
        // console.log('_createModelItem ', this.nodeset.nodeType);
        // console.log('_createModelItem model', this.model);
        // console.log('_createModelItem node', node);
        // console.log('_createModelItem node', node);
        // console.log('_createModelItem nodeType', node.nodeType);


        let value = null;

        let mItem = {};
        let targetNode = {};
        if(node.nodeType === node.TEXT_NODE){
            // const parent = node.parentNode;
            // console.log('PARENT ', parent);
            targetNode = node.parentNode;
        }else {
            targetNode = node;
        }

        // console.log('NODE ', targetNode);
        if(targetNode.nodeType === Node.ELEMENT_NODE){
            value = targetNode.textContent;
        }else{
            value = targetNode.nodeValue;
        }
        const ro = fx.evaluateXPath(this.readonly, targetNode, null, {});
        const req = fx.evaluateXPathToBoolean(this.required, targetNode, null, {});
        const rel = fx.evaluateXPath(this.relevant, targetNode, null, {});
        const val = fx.evaluateXPath(this.constraint, targetNode, null, {});

        const mi = new ModelItem( ro,rel,req,val,this.type,targetNode);

        this.model.registerModelItem(mi);
    }

}

customElements.define('xf-bind', XfBind);