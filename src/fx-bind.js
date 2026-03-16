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
import { getPath } from './xpath-path.js';

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
    /**
     * @type {Node[]}
     */
    this.nodeset = [];
    this.model = {};
    this.contextNode = {};
    this.inited = false;
  }

  connectedCallback() {
    // console.log('connectedCallback ', this);
    // this.id = this.hasAttribute('id')?this.getAttribute('id'):;
    this.constraint = this.getAttribute('constraint');
    this.ref = this.getAttribute('ref') || '.';
    this.readonly = this.getAttribute('readonly');
    this.required = this.getAttribute('required');
    this.relevant = this.getAttribute('relevant');
    this.type = this.hasAttribute('type') ? this.getAttribute('type') : FxBind.TYPE_DEFAULT;
    this.calculate = this.getAttribute('calculate');
    // For self-references, just apply the facets to the parent bind
    if (this.ref === '.') {
      const parent = this.parentNode;
      if (parent instanceof FxBind) {
        // For overlapping binds, the last one wins
        parent.calculate ||= this.calculate;
        parent.readonly ||= this.readonly;
        parent.required ||= this.required;
        parent.relevant ||= this.relevant;
        parent.constraint ||= this.constraint;
      }
    }
  }
  /**
   * @param {string} ref -
   * @param {Node} node -
   * @param {ForeElementMixin} boundElement -
   *
   * @returns {ModelItem}
   */
  static createModelItem(ref, node, boundElement, opNum) {
    const instanceId = XPathUtil.resolveInstance(boundElement, boundElement.ref);
    if (Array.isArray(node)) {
      node = node[0];
    }
    if (!node.nodeType) {
      // This node set is not pointing to nodes, but some other type.
      return new ModelItem(
        ref,
        'non-node item',
        node,
        null,
        instanceId,
        boundElement.getOwnerForm(),
      );
    }

    // ✅ only the repeat item gets the _<opNum> suffix; children do not.
    const basePath = getPath(node, instanceId);
    const path = opNum ? `${basePath}_${opNum}` : basePath;

    // const path = XPathUtil.getPath(node, instanceId);

    // naive approach to finding matching bind elements for given ref if not provided by caller.
    // Use XPath and variables to escape XPaths in the ref
    /**
     * @type {import('./fx-bind.js').FxBind}
     */
    /*
    const bind = evaluateXPathToFirstNode(
      'descendant::fx-bind[@ref=$ref]',
      boundElement.getModel(),
      null,
      {
        ref: boundElement.ref,
      },
    );
*/
    const bind = boundElement.getOwnerForm().querySelector(`fx-bind[ref="${ref}"]`);

    let modelItem = boundElement.getModel().getModelItem(node);
    if (!modelItem) {
      if (bind) {
        modelItem = new ModelItem(
          path,
          boundElement.getBindingExpr(),
          node,
          bind,
          instanceId,
          boundElement.getOwnerForm(),
        );
        const alert = bind.getAlert();
        if (alert) {
          modelItem.addAlert(alert);
        }
      } else {
        // no binding facets apply
        modelItem = new ModelItem(
          path,
          boundElement.getBindingExpr(),
          node,
          null,
          instanceId,
          boundElement.getOwnerForm(),
        );
      }
      // boundElement.getModel().registerModelItem(modelItem);
    }

    return modelItem;
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
    this._getInstanceId();
    this.bindType = this.getModel().getInstance(this.instanceId).type;

    // ✅ Always evaluate nodeset first (XML + JSON)
    this._evalInContext();

    // ✅ Build dependency graph for both types
    this._buildBindGraph();

    // ✅ Create modelitems for both types
    if (this.bindType === 'xml') {
      this._createModelItems();
    } else if (this.bindType === 'json') {
      this._createModelItemsForJSON();
    }

    this._processChildren(model);
  }

  _buildBindGraph() {
    // ✅ Works for XML and JSON (JSON nodes have getPath()/getPath() handles __jsonlens__)
    this.nodeset.forEach(node => {
      const instanceId = XPathUtil.resolveInstance(this, this.ref);
      const path = getPath(node, instanceId);

      this.model.mainGraph.addNode(path, node);

      if (this.calculate) {
        this.model.mainGraph.addNode(`${path}:calculate`, node);
        this.model.mainGraph.addDependency(path, `${path}:calculate`);
      }

      const calculateRefs = this._getReferencesForProperty(this.calculate, node);
      if (calculateRefs.length !== 0) {
        this._addDependencies(calculateRefs, node, path, 'calculate', instanceId);
      }

      if (!this.calculate) {
        const readonlyRefs = this._getReferencesForProperty(this.readonly, node);
        if (readonlyRefs.length !== 0) {
          this._addDependencies(readonlyRefs, node, path, 'readonly', instanceId);
        } else if (this.readonly) {
          this.model.mainGraph.addNode(`${path}:readonly`, node);
        }
      }

      const requiredRefs = this._getReferencesForProperty(this.required, node);
      if (requiredRefs.length !== 0) {
        this._addDependencies(requiredRefs, node, path, 'required', instanceId);
      } else if (this.required) {
        this.model.mainGraph.addNode(`${path}:required`, node);
      }

      const relevantRefs = this._getReferencesForProperty(this.relevant, node);
      if (relevantRefs.length !== 0) {
        this._addDependencies(relevantRefs, node, path, 'relevant', instanceId);
      } else if (this.relevant) {
        this.model.mainGraph.addNode(`${path}:relevant`, node);
      }

      const constraintRefs = this._getReferencesForProperty(this.constraint, node);
      if (constraintRefs.length !== 0) {
        this._addDependencies(constraintRefs, node, path, 'constraint', instanceId);
      } else if (this.constraint) {
        this.model.mainGraph.addNode(`${path}:constraint`, node);
        this.model.mainGraph.addDependency(path, `${path}:constraint`);
      }
    });
  }
  /**
   * Resolves a referenced ModelItem using the model's graph and node registry.
   * @param {string} refName
   * @returns {ModelItem | null}
   */
  resolveModelItem(refName) {
    if (!this.model?.mainGraph || !this.model?.getModelItemForNode) return null;

    const suffixes = [`/${refName}`, `:${refName}`];

    for (const [path, node] of this.model.mainGraph.nodeMap.entries()) {
      if (suffixes.some(suffix => path.endsWith(suffix))) {
        const modelItem = this.model.getModelItemForNode(node);
        if (modelItem) return modelItem;
      }
    }

    return null;
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
  _addDependencies(refs, node, path, property, instanceId) {
    const nodeHash = `${path}:${property}`;

    if (refs.length !== 0) {
      if (!this.model.mainGraph.hasNode(nodeHash)) {
        this.model.mainGraph.addNode(nodeHash, node);
      }

      refs.forEach(ref => {
        const otherPath = getPath(ref, instanceId);

        // keep old XML-only hack
        if (this.bindType === 'xml' && otherPath.endsWith('text()[1]')) return;

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

  _createModelItemsForJSON() {
    const fore = this.closest('fx-fore');
    const instanceId = this.instanceId;

    this.nodeset.forEach(jsonNode => {
      const path = getPath(jsonNode, instanceId);

      // ✅ ModelItem node should be the JSONNode itself (lens), NOT JSONLens
      const newItem = new ModelItem(path, this.getBindingExpr(), jsonNode, this, instanceId, fore);

      const alert = this.getAlert();
      if (alert) newItem.addAlert(alert);

      this.getModel().registerModelItem(newItem);
    });
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
      } else if (inst.type === 'json') {
        // ✅ JSON must also resolve the nodeset via XPath evaluation
        this.nodeset = evaluateXPathToNodes(this.ref, inscopeContext, this);
      } else {
        this.nodeset = [];
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
    const instanceId = XPathUtil.resolveInstance(this, this.ref);

    const path = getPath(node, instanceId);
    // const shortPath = this.shortenPath(path);

    // ### constructing default modelitem - will get evaluated during recalculate()
    // ### constructing default modelitem - will get evaluated during recalculate()
    // ### constructing default modelitem - will get evaluated during recalculate()
    // const newItem = new ModelItem(shortPath,
    const fore = this.closest('fx-fore');
    const newItem = new ModelItem(path, this.getBindingExpr(), targetNode, this, instanceId, fore);

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
    // For XML, DependencyNotifyingDomFacade reliably reports the nodes touched during evaluation.
    // For JSON lens nodes, the domFacade hook does not fire (evaluation goes through our lens resolver),
    // so we must extract lookup tokens and resolve them explicitly.

    if (!propertyExpr) return [];

    // JSON path: resolve dependencies by parsing lens lookups in the expression.
    if (this.bindType === 'json') {
      const touchedNodes = new Set();
      const tokens = this._extractJsonLookupTokens(propertyExpr);

      // Evaluate each token in the *current* context node (each item in nodeset)
      this.nodeset.forEach(node => {
        tokens.forEach(token => {
          try {
            const refs = evaluateXPathToNodes(token, node, this);
            refs.forEach(r => touchedNodes.add(r));
          } catch (_e) {
            // ignore: dependency extraction must never break bind initialization
          }
        });
      });

      return Array.from(touchedNodes.values());
    }

    // XML path: use dom facade for accurate dependency tracking
    const touchedNodes = new Set();
    const domFacade = new DependencyNotifyingDomFacade(otherNode => touchedNodes.add(otherNode));
    this.nodeset.forEach(node => {
      evaluateXPathToString(propertyExpr, node, this, domFacade);
    });
    return Array.from(touchedNodes.values());
  }
  _extractJsonLookupTokens(expr) {
    if (!expr) return [];

    const src = String(expr);
    const tokens = new Set();

    // instance('id')?a?b?c  or instance('id')?*
    const instRe = /instance\s*\([^)]*\)\s*(?:\?\s*\*|\?\s*[a-zA-Z_][\w-]*)+/g;
    let m;
    while ((m = instRe.exec(src)) !== null) {
      if (m[0]) tokens.add(m[0].replace(/\s+/g, ''));
    }

    // relative lookups like ?title, ?year, ?ui, ?query (ignore ?*)
    const relRe = /\?[a-zA-Z_][\w-]*/g;
    while ((m = relRe.exec(src)) !== null) {
      if (m[0] && m[0] !== '?*') tokens.add(m[0]);
    }

    return Array.from(tokens);
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
    if (!this.instanceId && this.parentNode.nodeName === 'FX-BIND') {
      let parent = this.parentNode;
      while (parent && !this.instanceId) {
        const ref = parent.getBindingExpr();
        if (ref.startsWith('instance(')) {
          this.instanceId = XPathUtil.getInstanceId(ref);
          return;
        }
        if (parent.parentNode.nodeName !== 'FX-BIND') {
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
