import {LitElement, html, css} from 'lit-element';
import {ModelItem} from './modelitem.js';
import {XPathUtil} from './xpath-util.js';
import fx from './output/fontoxpath.js';
import {ForeElement} from "./ForeElement.js";

/**
 * XfBind declaratively attaches constraints to nodes in the data (instances).
 *
 * It's major task is to create ModelItem Objects for each Node in the data their ref is pointing to.
 *
 * References and constraint attributes use XPath statements to point to the nodes they are attributing.
 *
 * Note: why is xf-bind not extending BoundElement? Though xf-bind has a 'ref' attr it is not bound in the sense of
 * getting updates about changes of the bound nodes. Instead it  acts as a factory for modelItems that are used by
 * BoundElements to track their state.
 */
export class XfBind extends ForeElement {

    static get styles() {
        return css`
            :host {
                display: none;
            }
        `;
    }

    static get properties() {
        return {
            /**
             * allows to calculate a value. This value will become readonly.
             */
            calculate: {
                type: String
            },
            contextNode:{
                type:Object
            },
            /**
             * arbitrary XPath resolving to xs:boolean - defaults to 'true()'
             */
            constraint: {
                type: String
            },
            /**
             * id of this bind
             */
            id:{
                type:String
            },
            /**
             * the nodeset the bind is referring to by it's binding expression (ref attribute)
             */
            nodeset: {
                type: Array
            },
            /**
             * the owning model of this bind
             */
            model:{
                type:Object
            },
            /**
             * XPath statement resolving to xs:boolean to switch between readonly and readwrite mode - defaults to 'false()'
             */
            readonly: {
                type: String
            },
            /**
             * the XPath binding expression of this bind
             */
            ref: {
                type: String
            },
            /**
             * XPath statement resolving to xs:boolean to switch between relevant and non-relevant mode - defaults to 'true()'
             */
            relevant: {
                type: String
            },
            /**
             * XPath statement resolving to xs:boolean to switch between required and optional - defaults to 'false'.
             */
            required: {
                type: String
            },
            /**
             * XPath statement
             */
            type: {
                type: String
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

    /**
     * initializes the bind element by evaluating the binding expression.
     *
     * For each node referred to by the binding expr a ModelItem object is created.
     *
     * @param model
     */
    init(model){
        console.log('init binding ', this);
        this.instanceId = this._getInstanceId();

        this.evalInContext();
        this._createModelItems();

        // ### process child bindings
        const childbinds = this.querySelectorAll(':scope > xf-bind');
        Array.from(childbinds).forEach(bind =>{
            // console.log('init child bind ', bind);
            bind.init(model);
        });

    }

    render() {
        return html`
             <slot></slot>
        `;
    }

/*
    firstUpdated(_changedProperties) {
        super.firstUpdated(_changedProperties);
    }
*/

    namespaceResolver(prefix) {
        console.log('namespaceResolver  prefix', prefix);
        const ns = {
            'xhtml' : 'http://www.w3.org/1999/xhtml',
        };
        return ns[prefix] || null;
        // return null;
    }

    /**
     * overwrites
     */
    evalInContext(){
        const inscopeContext = this._inScopeContext();

        if(this.ref===''){
            this.nodeset = inscopeContext;
        }else if(Array.isArray(inscopeContext)){

            inscopeContext.forEach((n,index) => {

                if(XPathUtil.isSelfReference(this.ref)){
                    this.nodeset = inscopeContext;
                }else{
                    // const localResult = fx.evaluateXPathToFirstNode(this.ref, n, null, {namespaceResolver:  this.namespaceResolver});
                    const localResult = fx.evaluateXPathToNodes(this.ref, n, null, {namespaceResolver:  this.namespaceResolver});
                    localResult.forEach(item =>{
                       this.nodeset.push(item);
                    });
                    // console.log('local result: ', localResult);
                    // this.nodeset.push(localResult);
                }
            });

        }else{
            this.nodeset = fx.evaluateXPathToNodes(this.ref, inscopeContext, null, {namespaceResolver: this.namespaceResolver});
        }
    }


    _createModelItems(){
        // console.log('#### ', thi+s.nodeset);

/*
        if(XPathUtil.isSelfReference(this.ref)){
            return;
        }
*/
        if(Array.isArray(this.nodeset)){
            // todo - iterate and create
            // console.log('################################################ ', this.nodeset);
            Array.from(this.nodeset).forEach((n, index) => {
                // console.log('node ',n);
                this._createModelItem(n,index);

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
    _createModelItem(node,index){
        // console.log('_createModelItem ', this.nodeset);
        // console.log('_createModelItem ', this.nodeset.nodeType);
        // console.log('_createModelItem model', this.model);
        // console.log('_createModelItem node', node);
        // console.log('_createModelItem node', node);
        // console.log('_createModelItem nodeType', node.nodeType);
        // console.log('path() nodeType', fx.evaluateXPath('path()',node));

        let value = null;
        const mItem = {};
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
        const req = fx.evaluateXPath(this.required, targetNode, null, {});
        const rel = fx.evaluateXPath(this.relevant, targetNode, null, {});
        const val = fx.evaluateXPath(this.constraint, targetNode, null, {});


        let targetModelItem;
        // if(XPathUtil.isSelfReference(this.ref)){
        // if(this.ref === './text()' || this.ref === 'text()' || this.ref === '.' || this.ref === ''){
        if(XPathUtil.isSelfReference(this.ref)){
            // console.log('node ', node);
            // console.log('all modelItems ', this.model.modelItems);
            const parentModelItem = this.getModel().getModelItem(node);
            // console.log('parentModelItem ', parentModelItem);
            parentModelItem.required = req;

        }else{
            const path = fx.evaluateXPath('path()',node);
            const sp = this._shortenPath(path);
            const newItem = new ModelItem(sp, this.ref, ro,rel,req,val,this.type,targetNode);
            this.getModel().registerModelItem(newItem);
        }
        // const mi = new ModelItem( ro,rel,req,val,this.type,targetNode);

    }

    _shortenPath(path){
        const steps = path.split('/');
        let result='';
        for(let i=2;i<steps.length;i++){
            result += `/${steps[i]}`;
        }
        return result;
    }


    // todo: more elaborated implementation ;)
    _getInstanceId () {
        return 'default';
    }

}

customElements.define('xf-bind', XfBind);