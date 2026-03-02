import { DepGraph } from './dep_graph.js';
import { Fore } from './fore.js';
import './fx-instance.js';
import { ModelItem } from './modelitem.js';
import { parseJsonRef, getPath } from './xpath-path.js';
import { evaluateXPath, evaluateXPathToBoolean, evaluateXPathToNodes } from './xpath-evaluation.js';
import { XPathUtil } from './xpath-util.js';
import { getLensForNode } from './json/JSONNode.js';

/**
 * The model of this Fore scope. It holds all the intances, binding, submissions and custom
 * functions that as required.
 *
 * The model is updated by executing rebuild (as needed), recalculate and revalidate in turn.
 *
 * After the cycle is run all modelItems have updated their stete to reflect latest computations.
 *
 */
export class FxModel extends HTMLElement {
  static dataChanged = false;

  constructor() {
    super();
    // this.id = '';

    /**
     * @type {import('./fx-instance.js').FxInstance[]}
     */
    this.instances = [];
    /**
     * @type {import('./modelitem.js').ModelItem[]}
     */
    this.modelItems = [];
    this.defaultContext = {};
    this.changed = [];

    // this.mainGraph = new DepGraph(false);
    this.inited = false;
    this.modelConstructed = false;
    this.attachShadow({ mode: 'open' });
    this.computes = 0;
    this.fore = {};

    /**
     * @type {import('./fx-bind.js').FxBind[]}
     */
    this.binds = [];
  }

  /**
   * @returns {import('./fx-fore.js').FxFore}
   */
  get formElement() {
    return this.parentElement;
  }

  connectedCallback() {
    // console.log('connectedCallback ', this);
    this.setAttribute('inert', 'true');
    this.shadowRoot.innerHTML = `
            <slot></slot>
        `;

    /*
      this.addEventListener('model-construct-done', () => {
        // this.modelConstructed = true;
        // console.log('model-construct-done fired ', this.modelConstructed);
        // console.log('model-construct-done fired ', e.detail.model.instances);
      },
      { once: true },
    );
*/

    this.skipUpdate = false;
    this.fore = this.parentNode;
  }

  /**
   * Get the correct fx-bind for this element. Assumes the refs of all binds are always downwards.
   *
   * @param {ChildNode | Attr} elementOrAttribute - the element or attribute to resolve
   *
   * @returns {import('./fx-bind.js').FxBind | null}
   */
  getBindForElement(elementOrAttribute) {
    if (typeof elementOrAttribute !== 'object' || !('nodeType' in elementOrAttribute)) {
      // We only do binds over nodes. Not JSON.
      return null;
    }
    /**
     * @type {import('./fx-bind.js').FxBind | FxModel}
     */
    let bindForParent;
    const parent =
      elementOrAttribute.nodeType === elementOrAttribute.ATTRIBUTE_NODE
        ? elementOrAttribute.ownerElement
        : elementOrAttribute.parentNode;
    if (!parent?.parentElement) {
      // The root. Search from here
      bindForParent = this;
    } else {
      bindForParent = this.getBindForElement(parent);
    }
    if (!bindForParent) {
      return null;
    }

    /**
     * @type {import('./fx-bind.js').FxBind[]}
     */
    const childBinds = Array.from(bindForParent.children).filter(c => c.nodeName === 'FX-BIND');
    for (const childBind of childBinds) {
      const ref = childBind.ref;
      const matches = evaluateXPathToNodes(ref, parent, childBind);
      if (matches.includes(elementOrAttribute)) {
        return childBind;
      }
    }
    return null;
  }

  /**
   * Lazily create a ModelItem for nodes not explicitly bound via fx-bind
   * @param {FxModel}           model        The model to create a model item for
   * @param {string}            ref          The XPath ref that led to this model item
   * @param {Node}              node         The node the XPath led to
   * @param {ForeElementMixin)}  formElement  The form element making this model. Used to resolve variables against
   * @returns {ModelItem}
   */
  static lazyCreateModelItem(model, ref, node, formElement) {
    const instanceId = XPathUtil.resolveInstance(formElement, ref);
    const instance = model.getInstance(instanceId);
    const fore = model.formElement;

    if (fore?.createNodes && (node === null || node === undefined)) {
      const mi = new ModelItem(undefined, ref, null, null, instanceId, fore);
      mi.isSynthetic = true;
      model.registerModelItem(mi);
      return mi;
    }
    if (node === null || node === undefined) return null;

    let targetNode = Array.isArray(node) ? node[0] : node;

    // Wrap JSON primitives / raw values into a lens node when needed
    if (instance.type === 'json') {
      const parentLens = instance.nodeset;
      const parsedRef = parseJsonRef(ref);
      if (parsedRef && parsedRef.steps && parsedRef.steps.length > 0) {
        const key = parsedRef.steps[parsedRef.steps.length - 1];
        targetNode = getLensForNode(targetNode, parentLens, key, instanceId);
      }
    }

    // Compute canonical path
    let path = null;
    if (targetNode?.nodeType || targetNode?.__jsonlens__) {
      path = getPath(targetNode, instanceId);
    }

    const isLensObject =
        !!targetNode && typeof targetNode === 'object' &&
        typeof targetNode.get === 'function' && typeof targetNode.set === 'function';

    // If ModelItem for same path exists, RETARGET it (node OR lens)
    if (path) {
      const existingModelItem = model.modelItems.find(mi => mi.path === path);
      if (existingModelItem) {
        if (isLensObject) {
          if (existingModelItem.lens !== targetNode) {
            existingModelItem.lens = targetNode;
            existingModelItem.node = null;
          }
        } else {
          if (existingModelItem.node !== targetNode) {
            existingModelItem.node = targetNode;
            existingModelItem.lens = null;
          }
        }
        return existingModelItem;
      }
    }

    const mi = new ModelItem(
        path,
        ref,
        targetNode,
        model.getBindForElement(targetNode),
        instanceId,
        fore,
    );
    mi.isSynthetic = true;

    model.registerModelItem(mi);
    return mi;
  }
  /**
   * modelConstruct starts actual processing of the model by
   *
   * 1. loading instances if present or constructing one
   * 2. calling updateModel to run the model update cycle of rebuild, recalculate and revalidate
   *
   * @event model-construct-done is fired once all instances have be loaded or after generating instance
   *
   */
  async modelConstruct() {
    console.info(`📌 model-construct for #${this.parentNode.id}`);

    // this.dispatchEvent(new CustomEvent('model-construct', { detail: this }));
    Fore.dispatch(this, 'model-construct', { model: this });

    // console.time('instance-loading');
    const instances = this.querySelectorAll('fx-instance');
    if (instances.length > 0) {
      const promises = [];
      instances.forEach(instance => {
        promises.push(instance.init());
      });

      // Wait until all the instances are built
      await Promise.all(promises);
      this.instances = Array.from(instances);
      // Build in-memory variable bindings for instances (Variant A: no <fx-var> DOM nodes).
      // These bindings are merged into XPath variable resolution by xpath-evaluation.js.
      if (this.formElement) {
        const bindings = Object.create(null);

        // $default always points to the model's default instance (first instance)
        try {
          const defInst = this.getDefaultInstance();
          if (defInst) bindings.default = defInst.getDefaultContext();
        } catch (_e) {
          // ignore
        }

        // Also expose $<id> for explicitly id'ed instances
        this.instances.forEach(inst => {
          const explicitId = inst.getAttribute('id');
          if (!explicitId) return;
          // Do not overwrite $default binding; $default remains instance()
          if (explicitId === 'default') return;
          bindings[explicitId] = inst.getDefaultContext();
        });

        this.formElement._instanceVarBindings = bindings;
      }
      // console.log('_modelConstruct this.instances ', this.instances);
      // Await until the model-construct-done event is handled off
      this.modelConstructed = true;
      await Fore.dispatch(this, 'model-construct-done', { model: this });
      this.inited = true;

      this.updateModel();
    } else {
      // ### if there's no instance one will created
      console.log(`### <<<<< dispatching model-construct-done for '${this.fore.id}' >>>>>`);
      this.modelConstructed = true;
      await this.dispatchEvent(
        new CustomEvent('model-construct-done', {
          composed: false,
          bubbles: true,
          detail: { model: this },
        }),
      );
    }

    const functionlibImports = Array.from(this.querySelectorAll('fx-functionlib'));
    await Promise.all(functionlibImports.map(lib => lib.readyPromise));
    // console.timeEnd('instance-loading');
    this.inited = true;
  }

  registerModelItem(modelItem) {
    if (!modelItem) return null;

    const path = modelItem.path;

    const resetComputedState = mi => {
      // Tabula rasa for computed facets; keep identity (boundControls/observers)
      mi.readonly = ModelItem.READONLY_DEFAULT;
      mi.relevant = ModelItem.RELEVANT_DEFAULT;
      mi.required = ModelItem.REQUIRED_DEFAULT;
      mi.constraint = ModelItem.CONSTRAINT_DEFAULT;
      mi.type = ModelItem.TYPE_DEFAULT;

      // common extras in Fore's ModelItem
      if ('valid' in mi) mi.valid = true;
      if ('enabled' in mi) mi.enabled = true;
      mi.changed = false;

      // observer/dependency bookkeeping (safe to reset; will be rebuilt)
      if (mi.dependencies && typeof mi.dependencies.clear === 'function') mi.dependencies.clear();
      if (mi.stateExpressions) mi.stateExpressions = {};
      if (mi.state) mi.state = {};
    };

    const retarget = (target, source) => {
      // point to current backing node/lens
      if (source.lens) {
        target.lens = source.lens;
        target.node = null;
      } else if (source.node) {
        target.node = source.node;
        target.lens = null;
      }

      // keep metadata current
      if (source.ref) target.ref = source.ref;
      if (source.bind) target.bind = source.bind;
      if (source.instanceId) target.instanceId = source.instanceId;
      if (source.fore) target.fore = source.fore;

      // ✅ IMPORTANT: do NOT copy value!
      // For XML nodes, assigning `value` sets `node.textContent` and can delete child elements.

      resetComputedState(target);

      if (!target.boundControls) target.boundControls = [];
    };

    // ---- rebuild reuse-by-path (approach A) ----
    if (path && this._prevModelItemsByPath) {
      const prev = this._prevModelItemsByPath.get(path);
      if (prev) {
        retarget(prev, modelItem);

        if (!this.modelItems.includes(prev)) {
          this.modelItems.push(prev);
        }

        this._prevModelItemsByPath.delete(path);
        return prev;
      }
    }

    // ---- normal path ----
    if (!path) {
      // No path => can't reuse; keep as-is
      this.modelItems.push(modelItem);
      return modelItem;
    }

    const existing = this.modelItems.find(mi => mi.path === path);
    if (!existing) {
      // New canonical item
      resetComputedState(modelItem);
      this.modelItems.push(modelItem);
      return modelItem;
    }

    // Re-target canonical item
    retarget(existing, modelItem);
    return existing;
  }
  /**
   * update action triggering the update cycle
   */
  updateModel() {
    // console.time('updateModel');
    this.rebuild();
    /*
        if (this.skipUpdate){
            console.info('%crecalculate/revalidate skipped - no bindings', 'font-style: italic; background: #90a4ae; color:lightgrey; padding:0.3rem 5rem 0.3rem 0.3rem;display:block;width:100%;');
            return;
        }
*/
    this.recalculate();
    this.revalidate();
    // console.log('updateModel finished with modelItems ', this.modelItems);

    // console.timeEnd('updateModel');
  }

  /**
   * (Recursively) remove the model item of a node.
   * @param {Node} node - The node for which to remove the model item
   */
  removeModelItem(node) {
    if (!node) return;

    // Support both XML nodes (mi.node) and JSON lens nodes (mi.lens)
    const index = this.modelItems.findIndex(mi => mi.node === node || mi.lens === node);

    // The model item is not always there. Might be the case if a node is 'skipped' during rendering.
    // It may still have descendants that can have model items.
    if (index !== -1) {
      const mi = this.modelItems[index];

      // IMPORTANT:
      // Before removing the ModelItem, enqueue all observers (bound UI controls) for refresh.
      // Otherwise, deleting a bound node can orphan controls (eg. fx-group) because their ModelItem
      // disappears before the refresh scheduler can reach them.
      try {
        const fore = this.formElement || this.parentNode || mi.fore;
        if (fore && typeof fore.addToBatchedNotifications === 'function' && mi && mi.observers) {
          mi.observers.forEach(observer => {
            if (observer && typeof observer.refresh === 'function') {
              fore.addToBatchedNotifications(observer);
            }
          });
        }
      } catch (_e) {
        // ignore
      }

      this.modelItems.splice(index, 1);
    }

    // Recurse for XML descendants only
    if (node.childNodes) {
      for (const child of Array.from(node.childNodes)) {
        this.removeModelItem(child);
      }
    }
  }

  rebuild() {
    console.log(`🔷   rebuild() '${this.fore.id}'`);

    // Build a lookup for existing ModelItems so we can reuse them by path (approach A)
    const prevItems = Array.isArray(this.modelItems) ? this.modelItems : [];
    this._prevModelItemsByPath = new Map();
    prevItems.forEach(mi => {
      if (mi && mi.path) this._prevModelItemsByPath.set(mi.path, mi);
    });

    this.mainGraph = new DepGraph(false);
    this.modelItems = [];

    const binds = this.querySelectorAll('fx-model > fx-bind');
    if (binds.length === 0) {
      this.skipUpdate = true;
      this._prevModelItemsByPath = null;
      return;
    }

    binds.forEach(bind => bind.init(this));

    if (this.formElement.createNodes) {
      this.formElement.initData();
    }

    // Drop unused previous ModelItems (not re-registered this rebuild)
    this._prevModelItemsByPath = null;

    console.log('mainGraph', this.mainGraph);
    console.log('rebuild mainGraph calc order', this.mainGraph.overallOrder());

    Fore.dispatch(this, 'rebuild-done', { maingraph: this.mainGraph });
  }
  /**
   * recalculation of all modelItems. Uses dependency graph to determine order of computation.
   *
   * todo: use 'changed' flag on modelItems to determine subgraph for recalculation. Flag already exists but is not used.
   */
  async recalculate() {
    if (!this.mainGraph) {
      return;
    }

    console.log(`🔷🔷 recalculate() '${this.fore.id}'`);

    // console.log('changed nodes ', this.changed);
    this.computes = 0;

    this.subgraph = new DepGraph(false);
    // ### create the subgraph for all changed modelItems
    if (this.changed.length !== 0) {
      // ### build the subgraph
      this.changed.forEach(modelItem => {
        this.subgraph.addNode(modelItem.path, modelItem.node);
        // const dependents = this.mainGraph.dependantsOf(modelItem.path, false);
        // this._addSubgraphDependencies(modelItem.path);
        if (this.mainGraph.hasNode(modelItem.path)) {
          // const dependents = this.mainGraph.directDependantsOf(modelItem.path)

          const all = this.mainGraph.dependantsOf(modelItem.path, false);
          const dependents = all.reverse();
          if (dependents.length !== 0) {
            dependents.forEach(dep => {
              // const subdep = this.mainGraph.dependentsOf(dep,false);
              // subgraph.addDependency(dep, modelItem.path);
              const val = this.mainGraph.getNodeData(dep);
              this.subgraph.addNode(dep, val);
              if (dep.includes(':')) {
                const path = dep.substring(0, dep.indexOf(':'));
                this.subgraph.addNode(path, val);

                const deps = this.mainGraph.dependentsOf(modelItem.path, false);
                // if we find the dep to be first in list of dependents we are dependent on ourselves not adding edge to modelItem.path
                if (deps.indexOf(dep) !== 0) {
                  this.subgraph.addDependency(dep, modelItem.path);
                }
              }
              // subgraph.addDependency(dep,modelItem.path);
            });
          }
        }
      });

      // ### compute the subgraph
      const ordered = this.subgraph.overallOrder(false);
      ordered.forEach(path => {
        if (this.mainGraph.hasNode(path)) {
          const node = this.mainGraph.getNodeData(path);
          this.compute(node, path);
        }
      });
      /*
      const toRefresh = [...this.changed];
      this.formElement.toRefresh = toRefresh;
*/
      this.changed = [];
      Fore.dispatch(this, 'recalculate-done', { graph: this.subgraph, computes: this.computes });
    } else {
      const v = this.mainGraph.overallOrder(false);
      v.forEach(path => {
        const node = this.mainGraph.getNodeData(path);
        this.compute(node, path);
      });
      Fore.dispatch(this, 'recalculate-done', { graph: this.mainGraph, computes: this.computes });
    }
    console.log(`${this.parentElement.id} recalculate finished with modelItems `, this.modelItems);
  }

  /*
      _addSubgraphDependencies(path){
          const dependents = this.mainGraph.directDependantsOf(path)

          const alreadyInGraph = this.subgraph.incomingEdges[path];
          // const alreadyInGraph = path in this.subgraph;
          if(dependents.length !== 0 && alreadyInGraph.length === 0){

              dependents.forEach(dep => {
                  // const val= this.mainGraph.getNodeData(dep);
                  // this.subgraph.addNode(dep,val);
                  if(dep.includes(':')){
                      const subpath = dep.substring(0, dep.indexOf(':'));
                      // this.subgraph.addNode(subpath,val);
                      this.subgraph.addDependency(subpath,dep);
                      this.subgraph.addDependency(dep,path);
                      /!*
                                          const subdeps = this.mainGraph.directDependantsOf(path);
                                          console.log('subdeps',path, subdeps);
                                          subdeps.forEach(sdep => {
                                              const sval= this.mainGraph.getNodeData(sdep);
                                              this.subgraph.addNode(sdep,sval);
                                              console.log('subdep',sdep);
                                          });
                      *!/
                      if(this.subgraph.incomingEdges[dep] === 0){
                          this._addSubgraphDependencies(subpath)
                      }

                  }
              });

          }

      }
  */

  /**
   * (re-) computes a modelItem.
   * @param {Node} node - the node the modelItem is attached to
   * @param {string} path - the canonical XPath of the node
   */
  compute(node, path) {
    // Nodes in dep graphs can be transient during JSON insert/rebuild windows.
    // Preserve depGraph semantics, but avoid crashing when a ModelItem is momentarily missing.

    // Resolve facet property (eg. "$data/movies[3]/title:relevant")
    const isFacetPath = typeof path === 'string' && path.includes(':');
    if (!isFacetPath) return;

    const property = path.split(':')[1];
    if (!property) return;

    // Try to resolve the model item primarily by node, but fall back to canonical path.
    // The depGraph stores node data that may not be the same object identity after lens rebuild.
    let modelItem = this.getModelItem(node);

    if (!modelItem && node && (node.__jsonlens__ === true || typeof node.getPath === 'function')) {
      try {
        const instanceId = node.instanceId || XPathUtil.resolveInstance(this, path);
        const canonical = getPath(node, instanceId);
        modelItem = this.getModelItem(canonical);
      } catch (_e) {
        // ignore
      }
    }

    // If still missing, fall back to the prefix path of the facet node.
    // eg. "$data/movies[3]/title:relevant" => "$data/movies[3]/title"
    if (!modelItem) {
      const basePath = path.substring(0, path.indexOf(':'));
      modelItem = this.getModelItem(basePath);
    }

    // ✅ Minimal fix: don't crash the update cycle if the ModelItem doesn't exist.
    // This can happen during insert/delete when rebuild retargeting is in progress.
    if (!modelItem) {
      return;
    }

    if (modelItem && typeof path === 'string') {
      const expr = modelItem.bind ? modelItem.bind[property] : null;
      const context = modelItem.node || modelItem.lens;

      if (property === 'calculate') {
        const compute = evaluateXPath(expr, context, this);
        modelItem.value = compute;
        modelItem.readonly = true; // calculated nodes are always readonly
        modelItem.notify(); // Notify observers directly
      } else if (property !== 'constraint' && property !== 'type') {
        // ### re-compute the Boolean value of all facets expect 'constraint' and 'type' which are handled in revalidate()
        if (expr) {
          const compute = evaluateXPathToBoolean(expr, context, this);
          modelItem[property] = compute;
          // modelItem.notify(); // Notify observers directly
          this.fore.addToBatchedNotifications(modelItem);
        }
      }
      this.computes += 1;
    }
  }
  /**
   * Iterates all modelItems to calculate the validation status.
   *
   * Model alerts are given on 'fx-bind' elements as either attribute `alert` or as `fx-alert` child elements.
   *
   * During model-construct all model alerts are added to the modelItem if any
   *
   * to revalidate:
   * Gets the `constraint` attribute declaration from modelItem.bind
   * Computes the XPath to a Boolean
   * Updates the modelItem.constraint property
   *
   * todo: type checking
   * todo: run browser validation API
   *
   */
  revalidate() {
    if (this.modelItems.length === 0) return true;

    console.log(`🔷🔷🔷 revalidate() '${this.fore.id}'`);

    // reset submission validation
    // this.parentNode.classList.remove('submit-validation-failed')
    let valid = true;
    this.modelItems.forEach(modelItem => {
      // console.log('validating node ', modelItem.node);
      const { bind } = modelItem;
      if (bind) {
        /*
                        todo: investigate why bind is an element when created in fx-bind.init() and an fx-bind object when
                          created lazily.
                        */
        if (typeof bind.hasAttribute === 'function' && bind.hasAttribute('constraint')) {
          const constraint = bind.getAttribute('constraint');
          if (constraint && modelItem.node) {
            const compute = evaluateXPathToBoolean(constraint, modelItem.node, this);
            // console.log('modelItem validity computed: ', compute);
            modelItem.constraint = compute;
            // this.formElement.addToRefresh(modelItem); // let fore know that modelItem needs refresh
            modelItem.notify(); // Notify observers directly
            if (!compute) {
              console.log('validation failed on modelitem ', modelItem);
              valid = false;
            }
          }
        }
        if (typeof bind.hasAttribute === 'function' && bind.hasAttribute('required')) {
          const required = bind.getAttribute('required');
          if (required) {
            const compute = evaluateXPathToBoolean(required, modelItem.node, this);
            // console.log('modelItem required computed: ', compute);
            modelItem.required = compute;
            // this.formElement.addToRefresh(modelItem); // let fore know that modelItem needs refresh
            modelItem.notify(); // Notify observers directly
            if (modelItem.required && !modelItem.node.textContent) {
              /*
              console.log(
                'node is required but has no value ',
                XPathUtil.getDocPath(modelItem.node),
              );
*/
              valid = false;
            }
            // if (!compute) valid = false;
            /*
                                    if (!this.modelConstructed) {
                                      // todo: get alert from attribute or child element
                                      const alert = bind.getAlert();
                                      if (alert) {
                                        modelItem.addAlert(alert);
                                      }
                                    }
                        */
          }
        }
      }
    });
    console.log('modelItems after revalidate: ', this.modelItems);
    console.log('changed after revalidate: ', this.changed);
    console.log(
      'changed after revalidate changed: ',
      Array.from(this.parentNode._localNamesWithChanges),
    );
    console.log(
      'changed after revalidate batchedNotifications: ',
      Array.from(this.parentNode.batchedNotifications),
    );
    return valid;
  }

  addChanged(modelItem) {
    if (this.inited) {
      this.changed.push(modelItem);
    }
  }

  /**
   * Find a ModelItem by exact node or path
   * @param {Node|string} nodeOrPath
   * @returns {ModelItem|null}
   */
  getModelItem(nodeOrPath) {
    if (nodeOrPath == null) return null;

    // Path lookup
    if (typeof nodeOrPath === 'string') {
      const key = nodeOrPath.includes(':') ? nodeOrPath.substring(0, nodeOrPath.indexOf(':')) : nodeOrPath;
      return this.modelItems.find(mi => mi.path === key) || null;
    }

    // Node/lens lookup
    return (
        this.modelItems.find(mi => mi.node === nodeOrPath || mi.lens === nodeOrPath) || null
    );
  }

  /**
   * get the default evaluation context for this model.
   * @returns {Element}
   */
  getDefaultContext() {
    return this.instances[0].getDefaultContext();
  }

  /**
   * @returns {import('./fx-instance.js').FxInstance}
   */
  getDefaultInstance() {
    /*
        if (this.instances.length === 0) {
            throw new Error('No instances defined. Fore cannot work without any <data/> elements.');
        }
*/
    if (this.instances.length) {
      return this.instances[0];
    }
    return this.getInstance('default');
  }

  getDefaultInstanceData() {
    return this.instances[0].getInstanceData();
  }

  /**
   * @returns {import('./fx-instance.js').FxInstance}
   */
  getInstance(id) {
    let found = null;

    // default instance is first instance in this model
    if (id === 'default') {
      found = this.instances[0];
    }

    // ### lookup in local instances first
    if (!found) {
      const instArray = Array.from(this.instances);
      found = instArray.find(inst => inst.id === id);
    }

    // ### lookup in parent Fore if present (shared instances)
    if (!found) {
      const parentFore =
          this.fore.parentNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE
              ? this.fore.parentNode.host.closest('fx-fore')
              : this.fore.parentNode.closest('fx-fore');

      if (parentFore) {
        const parentInstances = parentFore.getModel().instances;
        const shared = parentInstances.filter(inst => inst.hasAttribute('shared'));
        found = shared.find(inst => inst.id === id);
      }
    }

    // ### search for shared instances in the light DOM (legacy)
    if (!found) {
      found = document.querySelector(`fx-instance[id="${id}"][shared]`);
    }

    // ### NEW: search for shared instances inside other fx-fore shadowRoots
    // This is required when a fore keeps its model/instances in its own shadow DOM
    // and sibling fores want to consume that instance via instance('id').
    if (!found) {
      const allFores = Array.from(document.querySelectorAll('fx-fore'));
      for (const fore of allFores) {
        // light DOM inside fore (in case someone authoring without shadow)
        const light = fore.querySelector?.(`fx-instance[id="${id}"][shared]`);
        if (light) {
          found = light;
          break;
        }

        // shadow DOM inside fore (common in your demos)
        const shadow = fore.shadowRoot?.querySelector?.(`fx-instance[id="${id}"][shared]`);
        if (shadow) {
          found = shadow;
          break;
        }
      }
    }

    if (found) return found;

    if (!found && this.fore.strict) {
      Fore.dispatch(this, 'error', {
        origin: this,
        message: `Instance '${id}' does not exist`,
        level: 'Error',
      });
    }
    return null;
  }

  evalBinding(bindingExpr) {
    // console.log('MODEL.evalBinding ', bindingExpr);
    // default context of evaluation is always the default instance
    const result = this.instances[0].evalXPath(bindingExpr);
    return result;
  }
}

if (!customElements.get('fx-model')) {
  customElements.define('fx-model', FxModel);
}
