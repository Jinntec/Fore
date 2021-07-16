import { DependencyNotifyingDomFacade } from './DependencyNotifyingDomFacade.js';
import { foreElementMixin } from './ForeElementMixin.js';
import { ModelItem } from './modelitem.js';
import {
  evaluateXPathToBoolean,
  evaluateXPathToNodes,
  evaluateXPathToString,
} from './xpath-evaluation.js';
import { XPathUtil } from './xpath-util.js';

/**
 * FxBind declaratively attaches constraints to nodes in the data (instances).
 *
 * It's major task is to create ModelItem Objects for each Node in the data their ref is pointing to.
 *
 * References and constraint attributes use XPath statements to point to the nodes they are attributing.
 *
 * Note: why is fx-bind not extending BoundElement? Though fx-bind has a 'ref' attr it is not bound in the sense of
 * getting updates about changes of the bound nodes. Instead it  acts as a factory for modelItems that are used by
 * BoundElements to track their state.
 */
// export class FxBind extends HTMLElement {
export class FxBind extends foreElementMixin(HTMLElement) {
  static READONLY_DEFAULT = false;

  static REQUIRED_DEFAULT = false;

  static RELEVANT_DEFAULT = true;

  static CONSTRAINT_DEFAULT = true;

  static TYPE_DEFAULT = 'xs:string';

  /*
    static get styles() {
        return css`
            :host {
                display: none;
            }
        `;
    }
*/

  /*
    static get properties() {
        return {
            ...super.properties,

            /!**
             * allows to calculate a value. This value will become readonly.
             *!/
            calculate: {
                type: String
            },
            contextNode:{
                type:Object
            },
            /!**
             * arbitrary XPath resolving to xs:boolean - defaults to 'true()'
             *!/
            constraint: {
                type: String
            },
            /!**
             * id of this bind
             *!/
            id:{
                type:String
            },
            /!**
             * the nodeset the bind is referring to by it's binding expression (ref attribute)
             *!/
            nodeset: {
                type: Array
            },
            /!**
             * the owning model of this bind
             *!/
            model:{
                type:Object
            },
            /!**
             * XPath statement resolving to xs:boolean to switch between readonly and readwrite mode - defaults to 'false()'
             *!/
            readonly: {
                type: String
            },
            /!**
             * the XPath binding expression of this bind
             *!/
            ref: {
                type: String
            },
            /!**
             * XPath statement resolving to xs:boolean to switch between relevant and non-relevant mode - defaults to 'true()'
             *!/
            relevant: {
                type: String
            },
            /!**
             * XPath statement resolving to xs:boolean to switch between required and optional - defaults to 'false'.
             *!/
            required: {
                type: String
            },
            /!**
             * XPath statement
             *!/
            type: {
                type: String
            }
        };
    }
*/

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

  connectedCallback() {
    // console.log('connectedCallback ', this);
    // this.id = this.hasAttribute('id')?this.getAttribute('id'):;
    this.ref = this.getAttribute('ref');
    this.readonly = this.getAttribute('readonly');
    this.required = this.getAttribute('required');
    this.relevant = this.getAttribute('relevant');
    this.type = this.hasAttribute('type') ? this.getAttribute('type') : FxBind.TYPE_DEFAULT;
    this.calculate = this.getAttribute('calculate');
  }

  /**
   * initializes the bind element by evaluating the binding expression.
   *
   * For each node referred to by the binding expr a ModelItem object is created.
   *
   * @param model
   */
  init(model) {
    this.model = model;
    console.log('init binding ', this);
    this.instanceId = this._getInstanceId();
    this.bindType = this.getModel().getInstance(this.instanceId).type;
    // console.log('binding type ', this.bindType);

    if (this.bindType === 'xml') {
      this._evalInContext();
      this._buildBindGraph();
      this._createModelItems();
    }

    // ### process child bindings
    this._processChildren(model);
  }

  /*
    //todo: certainly not ideal to rely on duplicating instance id on instance document - better way later ;)
    static getPath(node){
        let path = fx.evaluateXPath('path()',node);
        const instanceId = node.ownerDocument.firstElementChild.getAttribute('id');
        if(instanceId !== 'default'){
            return '#' + instanceId + FxBind.shortenPath(path);
        }else {
            return FxBind.shortenPath(path);
        }

    }
*/

  _buildBindGraph() {
    if (this.bindType === 'xml') {
      this.nodeset.forEach(node => {
        const path = XPathUtil.getPath(node);

        if (this.calculate) {
          this.model.mainGraph.addNode(`${path}:calculate`, node);
          // Calculated values are a dependency of the model item.
          // Make `model1` depend on `model1:calculate`
          this.model.mainGraph.addNode(path, node);
          this.model.mainGraph.addDependency(path, `${path}:calculate`);
        }

        const calculateRefs = this._getReferencesForProperty(this.calculate, node);
        if (calculateRefs.length !== 0) {
          this._addDependencies(calculateRefs, node, path, 'calculate');
        }

        const readonlyRefs = this._getReferencesForProperty(this.readonly, node);
        if (readonlyRefs.length !== 0) {
          this._addDependencies(readonlyRefs, node, path, 'readonly');
        } else if (this.readonly) {
          this.model.mainGraph.addNode(`${path}:readonly`, node);
        }

        // const requiredRefs = this.requiredReferences;
        const requiredRefs = this._getReferencesForProperty(this.required, node);
        if (requiredRefs.length !== 0) {
          this._addDependencies(requiredRefs, node, path, 'required');
        } else if (this.required) {
          this.model.mainGraph.addNode(`${path}:required`, node);
        }

        const relevantRefs = this._getReferencesForProperty(this.relevant, node);
        if (relevantRefs.length !== 0) {
          this._addDependencies(relevantRefs, node, path, 'relevant');
        } else if (this.relevant) {
          this.model.mainGraph.addNode(`${path}:relevant`, node);
        }

        const constraintRefs = this._getReferencesForProperty(this.constraint, node);
        if (constraintRefs.length !== 0) {
          this._addDependencies(constraintRefs, node, path, 'constraint');
        } else if (this.constraint) {
          this.model.mainGraph.addNode(`${path}:constraint`, node);
        }
      });
    }
  }

  _addNode(path, node) {
    if (!this.model.mainGraph.hasNode(path)) {
      this.model.mainGraph.addNode(path, { node });
    }
  }

  /**
   * Add the dependencies of this bind
   *
   * @param  {Node[]}  refs The nodes that are referenced by this bind. these need to be resolved before
   * this bind can be resolved.
   * @param  {Node}    node The start of the reference
   * @param  {string}  path The path to the start of the reference
   * @param  {string}  property The property with this dependency
   */
  _addDependencies(refs, node, path, property) {
    const nodeHash = `${path}:${property}`;
    if (refs.length !== 0) {
      if (!this.model.mainGraph.hasNode(nodeHash)) {
        this.model.mainGraph.addNode(nodeHash, node);
      }
      refs.forEach(ref => {
        const otherPath = XPathUtil.getPath(ref);

        if (!this.model.mainGraph.hasNode(otherPath)) {
          this.model.mainGraph.addNode(otherPath, ref);
        }
        this.model.mainGraph.addDependency(nodeHash, otherPath);
      });
    } else {
      this.model.mainGraph.addNode(nodeHash, node);
    }
  }

  _processChildren(model) {
    const childbinds = this.querySelectorAll(':scope > fx-bind');
    Array.from(childbinds).forEach(bind => {
      // console.log('init child bind ', bind);
      bind.init(model);
    });
  }

  /*
    render() {
        return html`
             <slot></slot>
        `;
    }
*/

  getAlert() {
    if (this.hasAttribute('alert')) {
      return this.getAttribute('alert');
    }
    const alertChild = this.querySelector('fx-alert');
    if (alertChild) {
      return alertChild.innerHTML;
    }
    return null;
  }

  /*
        firstUpdated(_changedProperties) {
            super.firstUpdated(_changedProperties);
        }
    */

  /*
  namespaceResolver(prefix) {
    // TODO: Do proper namespace resolving. Look at the ancestry / namespacesInScope of the declaration

    /!**
     * for (let ancestor = this; ancestor; ancestor = ancestor.parentNode) {
     * 	if (ancestor.getAttribute(`xmlns:${prefix}`)) {
     *   // Return value
     *  }
     * }
     *!/

    // console.log('namespaceResolver  prefix', prefix);
    const ns = {
      xhtml: 'http://www.w3.org/1999/xhtml',
      // ''    : Fore.XFORMS_NAMESPACE_URI
    };
    return ns[prefix] || null;
  }
*/

  /**
   * overwrites
   */
  _evalInContext() {
    const inscopeContext = this.getInScopeContext();

    // reset nodeset
    this.nodeset = [];

    if (this.ref === '' || this.ref === null) {
      this.nodeset = inscopeContext;
    } else if (Array.isArray(inscopeContext)) {
      inscopeContext.forEach(n => {
        if (XPathUtil.isSelfReference(this.ref)) {
          this.nodeset = inscopeContext;
        } else {
          // eslint-disable-next-line no-lonely-if
          if (this.ref) {
            const localResult = evaluateXPathToNodes(this.ref, n, this.getOwnerForm());
            localResult.forEach(item => {
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
    } else {
      const inst = this.getModel().getInstance(this.instanceId);
      if (inst.type === 'xml') {
        this.nodeset = evaluateXPathToNodes(this.ref, inscopeContext, this.getOwnerForm());
      } else {
        this.nodeset = this.ref;
      }
    }
  }

  _createModelItems() {
    // console.log('#### ', thi+s.nodeset);

    /*
                if(XPathUtil.isSelfReference(this.ref)){
                    return;
                }
        */
    if (Array.isArray(this.nodeset)) {
      // todo - iterate and create
      // console.log('################################################ ', this.nodeset);
      // Array.from(this.nodeset).forEach((n, index) => {
      Array.from(this.nodeset).forEach(n => {
        // console.log('node ',n);
        // this._createModelItem(n, index);
        this._createModelItem(n);
      });
    } else {
      this._createModelItem(this.nodeset);
    }
  }

  static lazyCreateModelitems(model, ref, nodeset) {
    if (Array.isArray(nodeset)) {
      Array.from(nodeset).forEach(n => {
        FxBind.lazyCreateModelItem(model, ref, n);
      });
    } else {
      FxBind.lazyCreateModelItem(model, ref, nodeset);
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
        const path = FxBind.getPath(node);

        // const path = Fore.evaluateXPath ('path()', node, this, Fore.namespaceResolver) ;

        // ### intializing ModelItem with default values (as there is no <fx-bind> matching for given ref)
        const mi = new ModelItem(path,
            ref,
            FxBind.READONLY_DEFAULT,
            FxBind.RELEVANT_DEFAULT,
            FxBind.REQUIRED_DEFAULT,
            FxBind.CONSTRAINT_DEFAULT,
            FxBind.TYPE_DEFAULT,
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
  // _createModelItem(node, index) {
  _createModelItem(node) {
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
    if (XPathUtil.isSelfReference(this.ref)) {
      const parentBoundElement = this.parentElement.closest('fx-bind[ref]');
      console.log('parent bound element ', parentBoundElement);

      if (parentBoundElement) {
        // todo: Could be fancier by combining them
        parentBoundElement.required = this.required; // overwrite parent property!
      } else {
        console.error('no parent bound element');
      }

      return;
    }

    // let value = null;
    // const mItem = {};
    let targetNode = {};
    if (node.nodeType === node.TEXT_NODE) {
      // const parent = node.parentNode;
      // console.log('PARENT ', parent);
      targetNode = node.parentNode;
    } else {
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
    const newItem = new ModelItem(
      path,
      this.getBindingExpr(),
      FxBind.READONLY_DEFAULT,
      FxBind.RELEVANT_DEFAULT,
      FxBind.REQUIRED_DEFAULT,
      FxBind.CONSTRAINT_DEFAULT,
      this.type,
      targetNode,
      this,
    );

    this.getModel().registerModelItem(newItem);
  }

  /**
   * Get the nodes that are referred by the given XPath expression
   *
   * @param  {string}  propertyExpr  The XPath to get the referenced nodes from
   *
   * @return {Node[]}  The nodes that are referenced by the XPath
   */
  _getReferencesForProperty(propertyExpr) {
    if (propertyExpr) {
      const touchedNodes = new Set();
      const domFacade = new DependencyNotifyingDomFacade(otherNode => touchedNodes.add(otherNode));
      this.nodeset.forEach(node => {
        evaluateXPathToString(propertyExpr, node, this.getOwnerForm(), domFacade);
      });

      return Array.from(touchedNodes.values());
    }
    return [];
  }

  _initBooleanModelItemProperty(property, node) {
    // evaluate expression to boolean
    const propertyExpr = this[property];
    // console.log('####### ', propertyExpr);
    const result = evaluateXPathToBoolean(propertyExpr, node, this);
    return result;
  }

  static shortenPath(path) {
    const steps = path.split('/');
    let result = '';
    for (let i = 2; i < steps.length; i += 1) {
      const step = steps[i];
      if (step.indexOf('{}') !== -1) {
        const q = step.split('{}');
        result += `/${q[1]}`;
      } else {
        result += `/${step}`;
      }
    }
    return result;
  }

  // todo: more elaborated implementation ;)
  _getInstanceId() {
    const bindExpr = this.getBindingExpr();
    // console.log('_getInstanceId bindExpr ', bindExpr);
    if (bindExpr.startsWith('instance(')) {
      this.instanceId = XPathUtil.getInstanceId(bindExpr);
      return this.instanceId;
    }
    if (this.instanceId) {
      return this.instanceId;
    }
    return 'default';
  }
}
customElements.define('fx-bind', FxBind);
