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
            /*
            * if we have an outermost bind having model as parent the default instance data are used as context.
            */
            this.nodeset = fx.evaluateXPath(this.ref, model.getDefaultInstanceData(), null, {});
        }else{
            // console.log('parent nodeset ', this.parentNode.nodeset);

            const parentContext = this.parentNode.nodeset;
            if(Array.isArray(parentContext)){
                parentContext.forEach((n,index) => {
                    // console.log('parent item ', n, index);
                    if(this.ref !== './text()'
                        && this.ref !== 'text()'
                    ){
                        const local = fx.evaluateXPathToFirstNode(this.ref, n, null, {});
                        // console.log('>>>>>>>>>>< local: ', local);

                        // console.log('local type ', local.nodeType);
                        this.nodeset.push(local);
                    }else{
                        this.nodeset = parentContext;
                    }
                });

            }else{
                this.nodeset = fx.evaluateXPathToFirstNode(this.ref, this.parentNode.nodeset, null, {});
            }

        }

        // console.log('xf-bind init nodeset ', this.nodeset);

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
        const relevant = fx.evaluateXPath(this.relevant, targetNode, null, {});
        const valid = fx.evaluateXPath(this.constraint, targetNode, null, {});



/*
        const modelItem = new ModelItem();
        modelItem.readonly = ro;
        modelItem.relevant = relevant;
        modelItem.required = req;
        modelItem.valid = valid;
        modelItem.value = value;
        modelItem.node = node;
*/
        const modelItem = {
            value: value,
            readonly:ro,
            required:req,
            relevant: relevant,
            valid:valid,
            type: this.type,
            node: targetNode
        };

        // console.log('xf-bind created modelItem: ', modelItem);

        this.model.registerBinding(targetNode, modelItem);

    }

}

customElements.define('xf-bind', XfBind);