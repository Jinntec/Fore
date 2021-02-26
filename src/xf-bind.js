// import {LitElement, html, css} from 'lit-element';
import * as fx from 'fontoxpath';
import {ModelItem} from './modelitem.js';
import {XPathUtil} from './xpath-util.js';
// import {Fore} from "./fore";
import {foreElementMixin} from "./ForeElementMixin.js";

function evaluateXPath (xpath, contextNode, formElement, namespaceResolver) {
	return fx.evaluateXPath(
		xpath,
		contextNode,
		null,
		{},
		fx.ANY_TYPE,
        {
		namespaceResolver,
		defaultFunctionNamespaceURI: 'http://www.w3.org/2002/xforms',
		moduleImports: {
			xf: 'http://www.w3.org/2002/xforms'
		},
		currentContext: {formElement}
	});
}

function evaluateXFormsXPathToNodes (xpath, contextNode, formElement, namespaceResolver) {
	return fx.evaluateXPathToNodes(
		xpath,
		contextNode,
		null,
		{},
		{
		namespaceResolver,
		defaultFunctionNamespaceURI: 'http://www.w3.org/2002/xforms',
		moduleImports: {
			xf: 'http://www.w3.org/2002/xforms'
		},
		currentContext: {formElement}
	});
}


function evaluateXFormsXPathToBoolean(xpath, contextNode, formElement, namespaceResolver) {
	return fx.evaluateXPathToBoolean(
		xpath,
		contextNode,
		null,
		{},
		{
		namespaceResolver,
		defaultFunctionNamespaceURI: 'http://www.w3.org/2002/xforms',
		moduleImports: {
			xf: 'http://www.w3.org/2002/xforms'
		},
		currentContext: {formElement}
	});
}


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
// export class XfBind extends HTMLElement {
export class XfBind extends foreElementMixin(HTMLElement){


    static READONLY_DEFAULT = false;

    static REQUIRED_DEFAULT = false;

    static RELEVANT_DEFAULT = true;

    static CONSTRAINT_DEFAULT = true;

    static TYPE_DEFAULT = 'xs:string';

    static get styles() {
        return css`
            :host {
                display: none;
            }
        `;
    }

    static get properties() {
        return {
            ...super.properties,

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
        // this.id='';
        // this.ref = '';
        // this.readonly = 'false()';
        // this.required = 'false()';
        // this.relevant = 'true()';
        // this.constraint = 'true()';
        // this.type = 'xs:string';
        // this.calculate = '';
        this.nodeset = [];
        this.model = {};
        this.contextNode = {};
        this.inited = false;
    }

    connectedCallback(){
        console.log('connectedCallback ', this);
        // this.id = this.hasAttribute('id')?this.getAttribute('id'):;
        this.ref = this.getAttribute('ref');
        this.readonly = this.getAttribute('readonly');
        this.required = this.getAttribute('required');
        this.relevant = this.getAttribute('relevant');
        this.type = this.hasAttribute('type')?this.getAttribute('type'):'string';
        this.calculate = this.getAttribute('calculate');

    }

    /**
     * initializes the bind element by evaluating the binding expression.
     *
     * For each node referred to by the binding expr a ModelItem object is created.
     *
     * @param model
     */
    init(model){
        this.model = model;
        console.log('init binding ', this);
        this.instanceId = this._getInstanceId();

        this._evalInContext();
        this._buildBindGraph();
        this._createModelItems();


        // ### process child bindings
        this._processChildren(model);
    }

/*
    //todo: certainly not ideal to rely on duplicating instance id on instance document - better way later ;)
    static getPath(node){
        let path = fx.evaluateXPath('path()',node);
        const instanceId = node.ownerDocument.firstElementChild.getAttribute('id');
        if(instanceId !== 'default'){
            return '#' + instanceId + XfBind.shortenPath(path);
        }else {
            return XfBind.shortenPath(path);
        }

    }
*/

    _buildBindGraph(){
        this.nodeset.forEach(node => {

            const path = XPathUtil.getPath(node);

            const calculateRefs = this._getReferencesForProperty(this.calculate,node);
            if(calculateRefs.length !== 0){
                this._addDependencies(calculateRefs,node,path,'calculate');
                this._addDependencies(calculateRefs,node,path,'calculate');
            }else if(this.calculate){
                this.model.mainGraph.addNode(`${path}:calculate`,node);
            }

            const readonlyRefs = this._getReferencesForProperty(this.readonly,node);
            if(readonlyRefs.length !== 0){
                this._addDependencies(readonlyRefs,node,path,'readonly');
            }else if(this.readonly){
                this.model.mainGraph.addNode(`${path}:readonly`,node);
            }

            // const requiredRefs = this.requiredReferences;
            const requiredRefs = this._getReferencesForProperty(this.required,node);
            if(requiredRefs.length !== 0){
                this._addDependencies(requiredRefs,node,path,'required');
            }else if (this.required){
                this.model.mainGraph.addNode(`${path}:required`,node);
            }

            const relevantRefs = this._getReferencesForProperty(this.relevant,node);
            if(relevantRefs.length !== 0 ){
                this._addDependencies(relevantRefs,node,path,'relevant');
            }else if(this.relevant){
                this.model.mainGraph.addNode(`${path}:relevant`,node);
            }

            const constraintRefs = this._getReferencesForProperty(this.constraint,node);
            if(constraintRefs.length !== 0) {
                this._addDependencies(constraintRefs,node,path,'constraint');
            }else if(this.constraint){
                this.model.mainGraph.addNode(`${path}:constraint`,node);
            }

        });

    }

    _addNode(path, node){
        if(!this.model.mainGraph.hasNode(path)){
            this.model.mainGraph.addNode(path,{node:node});
        }
    }

    _addDependencies(refs,node,path,property){
        if(refs.length !== 0){
            if(!this.model.mainGraph.hasNode(`${path}:${property}`)){
                // this.model.mainGraph.addNode(`${path}:${property}`,{node:node});
                this.model.mainGraph.addNode(`${path}:${property}`,node);
            }
            refs.forEach(ref => {
                const other = fx.evaluateXPath(ref,node);
                const otherPath = XPathUtil.getPath(other);

                if(!this.model.mainGraph.hasNode(otherPath)){
                    // this.model.mainGraph.addNode(otherPath,{node:other});
                    this.model.mainGraph.addNode(otherPath,other);
                }
                this.model.mainGraph.addDependency(`${path}:${property}`,otherPath);
            });
        }else{
            this.model.mainGraph.addNode(`${path}:${property}`,node);
        }
    }

    _processChildren(model) {
        const childbinds = this.querySelectorAll(':scope > xf-bind');
        Array.from(childbinds).forEach(bind => {
            // console.log('init child bind ', bind);
            bind.init(model);
        });
    }

    render() {
        return html`
             <slot></slot>
        `;
    }

    getAlert(){
        if(this.hasAttribute('alert')){
            return this.getAttribute('alert');
        }
        const alertChild = this.querySelector('xf-alert');
        if(alertChild){
            return alertChild.innerHTML;
        }
    }

    /*
        firstUpdated(_changedProperties) {
            super.firstUpdated(_changedProperties);
        }
    */

    namespaceResolver(prefix) {
        // TODO: Do proper namespace resolving. Look at the ancestry / namespacesInScope of the declaration

        /**
         * for (let ancestor = this; ancestor; ancestor = ancestor.parentNode) {
         * 	if (ancestor.getAttribute(`xmlns:${prefix}`)) {
         *   // Return value
         *  }
         * }
         */

            // console.log('namespaceResolver  prefix', prefix);
        const ns = {
                'xhtml' : 'http://www.w3.org/1999/xhtml'
                // ''    : Fore.XFORMS_NAMESPACE_URI
            };
        return ns[prefix] || null;
    }

    /**
     * overwrites
     */
    _evalInContext(){
        const inscopeContext = this._inScopeContext();

        //reset nodeset
        this.nodeset=[];

        if(this.ref==='' || this.ref === null){
            this.nodeset = inscopeContext;
        }else if(Array.isArray(inscopeContext)){

            inscopeContext.forEach((n,index) => {

                if(XPathUtil.isSelfReference(this.ref)){
                    this.nodeset = inscopeContext;
                }else{
                    // eslint-disable-next-line no-lonely-if
                    if(this.ref){
                        const localResult = fx.evaluateXPathToNodes (this.ref, n, null, {namespaceResolver:  this.namespaceResolver});
                        localResult.forEach(item =>{
                            this.nodeset.push(item);
                        });
                        /*
                                                const localResult = fx.evaluateXPathToFirstNode(this.ref, n, null, {namespaceResolver:  this.namespaceResolver});
                                                this.nodeset.push(localResult);
                        */
                    }
                    // console.log('local result: ', localResult);
                    // this.nodeset.push(localResult);
                }
            });

        }else{
            let formElement;
            for (let anc = this; anc; anc = anc.parentNode) {
                if (anc.localName === 'xf-form') {
                    formElement = anc;
                    break;
                }
            }
            this.nodeset = evaluateXFormsXPathToNodes(this.ref, inscopeContext, formElement, this.namespaceResolver)
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

    static lazyCreateModelitems(model,ref,nodeset){
        if(Array.isArray(nodeset)){
            Array.from(nodeset).forEach((n, index) => {
                XfBind.lazyCreateModelItem(model, ref,n);
            });
        }else{
            XfBind.lazyCreateModelItem(model, ref,nodeset);
        }

    }

/*
    static lazyCreateModelItem(model,ref,node){
        console.log('lazyCreateModelItem ', node);

        let mItem = {};
        let targetNode = {};
        if(node === null) return null;
        if(node.nodeType === node.TEXT_NODE){
            // const parent = node.parentNode;
            // console.log('PARENT ', parent);
            targetNode = node.parentNode;
        }else {
            targetNode = node;
        }

        // const path = fx.evaluateXPath('path()',node);
        const path = XfBind.getPath(node);

        // const path = Fore.evaluateXPath ('path()', node, this, Fore.namespaceResolver) ;

        // ### intializing ModelItem with default values (as there is no <xf-bind> matching for given ref)
        const mi = new ModelItem(path,
            ref,
            XfBind.READONLY_DEFAULT,
            XfBind.RELEVANT_DEFAULT,
            XfBind.REQUIRED_DEFAULT,
            XfBind.CONSTRAINT_DEFAULT,
            XfBind.TYPE_DEFAULT,
            targetNode,
            this);


        // console.log('new ModelItem is instanceof ModelItem ', mi instanceof ModelItem);
        model.registerModelItem(mi);
        return mi;
    }
*/


    /**
     * creates a ModelItem for given instance node.
     *
     * Please note that for textnode no ModelItem is created but instead the one of its parent is used which either
     * must exist and be initialized already when we hit the textnode.
     * @param node
     * @private
     */
    _createModelItem(node,index){
        // console.log('_createModelItem node', node, index);

        /*
                this.calculateReferences = this._getReferencesForProperty(this.calculate,node);
                this.readOnlyReferences = this._getReferencesForProperty(this.readonly,node);
                this.requiredReferences = this._getReferencesForProperty(this.required,node);
                this.relevantReferences = this._getReferencesForProperty(this.relevant,node);
                this.constraintReferences = this._getReferencesForProperty(this.constraint,node);
        */

        /*
        if bind is the dot expression we use the modelitem of the parent
         */
        if(XPathUtil.isSelfReference(this.ref)){

            const parentBoundElement = this.parentElement.closest('xf-bind[ref]');
            console.log('parent bound element ', parentBoundElement);

            if(parentBoundElement){
                //todo: Could be fancier by combining them
                parentBoundElement.required = this.required; //overwrite parent property!
            }else{
                console.error('no parent bound element');
            }

            return;
        }

        // let value = null;
        const mItem = {};
        let targetNode = {};
        if(node.nodeType === node.TEXT_NODE){
            // const parent = node.parentNode;
            // console.log('PARENT ', parent);
            targetNode = node.parentNode;
        }else {
            targetNode = node;
        }

        // const path = fx.evaluateXPath('path()',node);
        // const path = this.getPath(node);
        const path = XPathUtil.getPath(node);
        // const shortPath = this.shortenPath(path);

        // ### constructiong default modelitem - will get evaluated during reaalculate()
        // ### constructiong default modelitem - will get evaluated during reaalculate()
        // ### constructiong default modelitem - will get evaluated during reaalculate()
        // const newItem = new ModelItem(shortPath,
        const newItem = new ModelItem(path,
            this.getBindingExpr(),
            XfBind.READONLY_DEFAULT,
            XfBind.RELEVANT_DEFAULT,
            XfBind.REQUIRED_DEFAULT,
            XfBind.CONSTRAINT_DEFAULT,
            this.type,
            targetNode,
            this);

        this.getModel().registerModelItem(newItem);
    }

    _getReferencesForProperty(propertyExpr,node){
        if(propertyExpr){
            // const ast = fx.parseScript(propertyExpr, {}, new DOMParser().parseFromString('<nothing/>', 'text/xml'));
            // console.log(`AST for ${propertyExpr}`, ast.innerHTML);p

            const pieces = propertyExpr.split('depends');
            const dependants = [];
            pieces.forEach(step => {
                // console.log('step ', step);
                if(step.trim().startsWith('(')){
                    const name = step.substring(1,step.indexOf(')'));
                    dependants.push(name);
                }
            });
            // console.log(`dependants of ${propertyExpr} `, dependants);
            return dependants;
        }
        return [];
    }


    _initBooleanModelItemProperty(property, node){
        //evaluate expression to boolean
        const propertyExpr = this[property];
        // console.log('####### ', propertyExpr);
        const result = evaluateXFormsXPathToBoolean(propertyExpr, node, this, this.namespaceResolver);

        //if expression not simply true() or false() detect nodes referenced by readonly expr
        if(propertyExpr !== 'true()' && propertyExpr !== 'false()'){
            const ast = fx.parseScript(propertyExpr, {}, new DOMParser().parseFromString('<nothing/>', 'text/xml'));
            // console.log(`AST for ${propertyExpr}`, ast.innerHTML);

        }
        return result;
    }


    static shortenPath(path){
        const steps = path.split('/');
        let result='';
        for(let i=2;i<steps.length;i++){
            const step = steps[i];
            if(step.indexOf('{}') !== -1){
                const q = step.split('{}');
                result += `/${q[1]}`;
            }else{
                result += `/${step}`;
            }
        }
        return result;
    }


    // todo: more elaborated implementation ;)
    _getInstanceId () {
        const bindExpr = this.getBindingExpr();
        // console.log('_getInstanceId bindExpr ', bindExpr);
        if(bindExpr.startsWith('instance(')){
            this.instanceId = XPathUtil.getInstanceId(bindExpr);
            return this.instanceId;
        }
        if(this.instanceId){
            return this.instanceId;
        }
        return 'default';
    }

}
customElements.define('xf-bind', XfBind);
