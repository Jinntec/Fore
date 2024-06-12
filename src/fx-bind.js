import { DependencyNotifyingDomFacade } from './DependencyNotifyingDomFacade.js';
import ForeElementMixin from './ForeElementMixin.js';
import { ModelItem } from './modelitem.js';
import {
  evaluateXPathToBoolean,
  evaluateXPathToNodes,
  evaluateXPathToString,
} from './xpath-evaluation.js';
import { XPathUtil } from './xpath-util.js';
import getInScopeContext from './getInScopeContext.js';

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
 *
 * @customElements
 */
export class FxBind extends ForeElementMixin {
  static READONLY_DEFAULT = false;

  static REQUIRED_DEFAULT = false;

  static RELEVANT_DEFAULT = true;

  static CONSTRAINT_DEFAULT = true;

  static TYPE_DEFAULT = 'xs:string';

  constructor() {
    super();
    this.nodeset = [];
    this.model = {};
    this.contextNode = {};
    this.inited = false;
  }

  connectedCallback() {
    // console.log('connectedCallback ', this);
    // this.id = this.hasAttribute('id')?this.getAttribute('id'):;
    this.constraint = this.getAttribute('constraint');
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
    // console.log('init binding ', this);
    this._getInstanceId();
    this.bindType = this.getModel().getInstance(this.instanceId).type;
    // console.log('binding type ', this.bindType);

    if (this.bindType === 'xml') {
      this._evalInContext();
      this._buildBindGraph();
      this._createModelItems();
    }
    // todo: support json

    // ### process child bindings
    this._processChildren(model);
  }

  _buildBindGraph() {
    if (this.bindType === 'xml') {
		this.nodeset.forEach(node => {
			          const instance = XPathUtil.resolveInstance(this,this.ref);

          const path = XPathUtil.getPath(node, instance);
        this.model.mainGraph.addNode(path, node);

        /* ### catching references in the 'ref' itself...
        todo: investigate cases where 'ref' attributes use predicates pointing to other nodes. These would not be handled
        in current implementation.

        General question: are there valid use-cases for using a 'filter' expression to narrow the nodeset
          where to apply constraints? Guess yes and if it's 'just' for reducing the amount of necessary modelItem objects.


        */
        // const foreignRefs = this.getReferences(this.ref);

        if (this.calculate) {
          this.model.mainGraph.addNode(`${path}:calculate`, node);
          // Calculated values are a dependency of the model item.
          this.model.mainGraph.addDependency(path, `${path}:calculate`);
        }

        const calculateRefs = this._getReferencesForProperty(this.calculate, node);
        if (calculateRefs.length !== 0) {
          this._addDependencies(calculateRefs, node, path, 'calculate');
        }

        if (!this.calculate) {
          const readonlyRefs = this._getReferencesForProperty(this.readonly, node);
          if (readonlyRefs.length !== 0) {
            this._addDependencies(readonlyRefs, node, path, 'readonly');
          } else if (this.readonly) {
            this.model.mainGraph.addNode(`${path}:readonly`, node);
          }
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
          this.model.mainGraph.addDependency(path, `${path}:constraint`);
        }
      });
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
    // console.log('_addDependencies',path);
    const nodeHash = `${path}:${property}`;
    if (refs.length !== 0) {
      if (!this.model.mainGraph.hasNode(nodeHash)) {
        this.model.mainGraph.addNode(nodeHash, node);
      }
		refs.forEach(ref => {
			const instance = XPathUtil.resolveInstance(this, path);

			const otherPath = XPathUtil.getPath(ref, instance);
        // console.log('otherPath', otherPath)

        // todo: nasty hack to prevent duplicate pathes like 'a[1]' and 'a[1]/text()[1]' to end up as separate nodes in the graph
        if (!otherPath.endsWith('text()[1]')) {
          if (!this.model.mainGraph.hasNode(otherPath)) {
            this.model.mainGraph.addNode(otherPath, ref);
          }
          this.model.mainGraph.addDependency(nodeHash, otherPath);
        }
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

  /**
   * overwrites
   */
  _evalInContext() {
    const inscopeContext = getInScopeContext(this.getAttributeNode('ref') || this, this.ref);

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
            const localResult = evaluateXPathToNodes(this.ref, n, this);
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
        this.nodeset = evaluateXPathToNodes(this.ref, inscopeContext, this);
      } else {
        this.nodeset = this.ref;
      }
    }
  }

  _createModelItems() {
    // console.log('#### ', thi+s.nodeset);

    if (Array.isArray(this.nodeset)) {
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
      const parentBoundElement = XPathUtil.getClosest('fx-bind[ref]', this.parentElement);
      // console.log('parent bound element ', parentBoundElement);

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
    /*
    let targetNode = {};
    if (node.nodeType === node.TEXT_NODE) {
      // const parent = node.parentNode;
      // console.log('PARENT ', parent);
      targetNode = node.parentNode;
    } else {
      targetNode = node;
    }
*/
    const targetNode = node;

    // const path = fx.evaluateXPath('path()',node);
      // const path = this.getPath(node);
	  const instance = XPathUtil.resolveInstance(this, this.ref);

      const path = XPathUtil.getPath(node, instance);
    // const shortPath = this.shortenPath(path);

    // ### constructing default modelitem - will get evaluated during recalculate()
    // ### constructing default modelitem - will get evaluated during recalculate()
    // ### constructing default modelitem - will get evaluated during recalculate()
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

    const alert = this.getAlert();
    if (alert) {
      newItem.addAlert(alert);
    }


    this.getModel().registerModelItem(newItem);
  }

  /**
   * Get the nodes that are referred by the given XPath expression
   *
   * @param  {string}  propertyExpr  The XPath to get the referenced nodes from
   *
   * @return {Node[]}  The nodes that are referenced by the XPath
   *
   * todo: DependencyNotifyingDomFacade reports back too much in some cases like 'a[1]' and 'a[1]/text[1]'
   */
  _getReferencesForProperty(propertyExpr) {
    if (propertyExpr) {
      return this.getReferences(propertyExpr);
    }
    return [];
  }

  getReferences(propertyExpr) {
    const touchedNodes = new Set();
    const domFacade = new DependencyNotifyingDomFacade(otherNode => touchedNodes.add(otherNode));
    this.nodeset.forEach(node => {
      evaluateXPathToString(propertyExpr, node, this, domFacade);
    });
    return Array.from(touchedNodes.values());
  }

  /*
    static getReferencesForRef(ref,nodeset){
      if (ref && nodeset) {
        const touchedNodes = new Set();
        const domFacade = new DependencyNotifyingDomFacade(otherNode => touchedNodes.add(otherNode));
        nodeset.forEach(node => {
          evaluateXPathToString(ref, node, this, domFacade);
        });

      return Array.from(touchedNodes.values());
    }
    return [];
  }
  */

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

  /**
   * return the instance id this bind is associated with. Resolves upwards in binds to either find an expr containing
   * and instance() function or if not found return 'default'.
   * @private
   */
  _getInstanceId() {
    const bindExpr = this.getBindingExpr();
    // console.log('_getInstanceId bindExpr ', bindExpr);
    if (bindExpr.startsWith('instance(')) {
      this.instanceId = XPathUtil.getInstanceId(bindExpr);
      return;
    }
    if(!this.instanceId && this.parentNode.nodeName === 'FX-BIND'){
      let parent = this.parentNode;
      while(parent && !this.instanceId){
        const ref = parent.getBindingExpr();
        if (ref.startsWith('instance(')) {
          this.instanceId = XPathUtil.getInstanceId(ref);
          return;
        }
        if(parent.parentNode.nodeName !== 'FX-BIND'){
          this.instanceId = 'default';
          break;
        }
        parent = parent.parentNode;
      }
    }
    this.instanceId = 'default';
  }



}

if (!customElements.get('fx-bind')) {
  customElements.define('fx-bind', FxBind);
}
