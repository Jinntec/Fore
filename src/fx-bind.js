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
import { DependencyTracker } from './DependencyTracker';
import { NodeBinding } from './binding/NodeBinding.js';
import { ReturnType, evaluateXPathToFirstNode } from 'fontoxpath';
import observeXPath from './xpathObserver.js';
import { RepeatBinding } from './binding/RepeatBinding.js';

// import {FacetBinding} from "./binding/FacetBinding";

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
        this.ref = this.getAttribute('ref') || '.';
        this.readonly = this.getAttribute('readonly');
        this.required = this.getAttribute('required');
        this.relevant = this.getAttribute('relevant');
        this.type = this.hasAttribute('type')
            ? this.getAttribute('type')
            : FxBind.TYPE_DEFAULT;
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
     * initializes the bind element by evaluating the binding expression.
     *
     * For each node referred to by the binding expr a ModelItem object is created.
     *
     * @param model
     */
    init(model) {
        this.model = model;
        console.log('init binding ', this);
        this._getInstanceId();
        this.bindType = this.getModel().getInstance(this.instanceId).type;
        // console.log('binding type ', this.bindType);

        if (this.bindType === 'xml') {
            this._evalInContext();
            this.buildBindings();
        }

        // ### process child bindings
        this._processChildren(model);
    }

    /**
     * create ModelItem state object and setup a NodeBinding for each node in the nodeset.
     */
    buildBindings() {
        if (this.bindType === 'xml') {
            this.nodeset.forEach((node) => {
                this.createBindingObjects(node);
            });
        }
    }

    createBindingObjects(node) {
        // create ModelItem to wrap the node
        const modelItem = FxBind.createModelItem(this.ref, node, this);
        // const modelItem = FxBind.createModelItem(this.ref, node, this,this);

        // create a NodeBinding and let it take care of facet registration.
        const nodeBinding = new NodeBinding(modelItem, this.getOwnerForm());
        // register the Binding
        DependencyTracker.getInstance().registerBinding(
            modelItem.path,
            nodeBinding,
        );

        if (this.calculate) {
            const calculateKey = `${modelItem.path}:calculate`;
            // Calculated values are a dependency of the model item.
            DependencyTracker.getInstance().dependencyGraph.addDependency(
                modelItem.path,
                calculateKey,
            );
        }
    }

    _processChildren(model) {
        const childbinds = this.querySelectorAll(':scope > fx-bind');
        Array.from(childbinds).forEach((bind) => {
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
        const inscopeContext = getInScopeContext(
            this.getAttributeNode('ref') || this,
            this.ref,
        );

        // reset nodeset
        this.nodeset = [];

        if (this.ref === '' || this.ref === null) {
            this.nodeset = inscopeContext;
        } else if (Array.isArray(inscopeContext)) {
            inscopeContext.forEach((n) => {
                if (XPathUtil.isSelfReference(this.ref)) {
                    this.nodeset = inscopeContext;
                } else {
                    // eslint-disable-next-line no-lonely-if
                    if (this.ref) {
                        const localResult = evaluateXPathToNodes(
                            this.ref,
                            n,
                            this,
                        );
                        localResult.forEach((item) => {
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
                this.nodeset = evaluateXPathToNodes(
                    this.ref,
                    inscopeContext,
                    this,
                );
            } else {
                this.nodeset = this.ref;
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
    static createModelItem(ref, node, boundElement) {
        const instanceId = XPathUtil.resolveInstance(boundElement, ref);
        if (!node.nodeType) {
            // This node set is not pointing to nodes, but some other type.
            return new ModelItem(
                ref,
                'non-node item',
                node,
                null,
                instanceId,
                boundElement.getModel(),
            );
        }

        const path = XPathUtil.getPath(node, instanceId);

        // naive approach to finding matching bind elements for given ref if not provided by caller.
        // Use XPath and variables to escape XPaths in the ref
        /**
         * @type {import('./fx-bind.js').FxBind}
         */
        const bind = evaluateXPathToFirstNode(
            'descendant::fx-bind[@ref=$ref]',
            boundElement.getModel(),
            null,
            {
                ref: boundElement.ref,
            },
        );
        let modelItem = boundElement.getModel().getModelItem(node);
        if (!modelItem) {
            if (bind) {
                modelItem = new ModelItem(
                    path,
                    boundElement.getBindingExpr(),
                    node,
                    bind,
                    instanceId,
                    boundElement.getModel(),
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
                    boundElement.getModel(),
                );
            }
            boundElement.getModel().registerModelItem(modelItem);
        }

        return modelItem;
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
    /*
  _getReferencesForProperty(propertyExpr) {
    if (propertyExpr) {
      return this.getReferences(propertyExpr);
    }
    return [];
  }
*/

    /*
  getReferences(propertyExpr) {
    const touchedNodes = new Set();
    const domFacade = new DependencyNotifyingDomFacade(otherNode => touchedNodes.add(otherNode));
    this.nodeset.forEach((node) => {
      evaluateXPathToString(propertyExpr, node, this, domFacade);
    });
    return Array.from(touchedNodes.values());
  }
*/

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
