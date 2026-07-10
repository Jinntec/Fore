import { DepGraph } from './dep_graph.js';
import { Fore } from './fore.js';
import './fx-instance.js';
import { ModelItem } from './modelitem.js';
import { parseJsonRef, getPath } from './xpath-path.js';
import { evaluateXPath, evaluateXPathToBoolean, evaluateXPathToNodes } from './xpath-evaluation.js';
import { XPathUtil } from './xpath-util.js';
import { getLensForNode } from './json/JSONNode.js';
import { UndoManager } from './UndoManager.js';

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
    /** @type {Map<string, import('./modelitem.js').ModelItem>} path -> ModelItem index, kept in sync with modelItems */
    this._modelItemsByPath = new Map();
    /** @type {Map<Node|object, import('./modelitem.js').ModelItem>} node/lens -> ModelItem index, kept in sync with modelItems */
    this._modelItemsByKey = new Map();
    this.defaultContext = {};
    this.changed = [];

    // this.mainGraph = new DepGraph(false);
    this.inited = false;
    this.modelConstructed = false;
    this.attachShadow({ mode: 'open' });
    this.computes = 0;
    this.fore = {};
    this.undoManager = new UndoManager(this);

    /**
     * @type {import('./fx-bind.js').FxBind[]}
     */
    this.binds = [];

    this.debugInfo = {
      debugId: `model-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: performance.now(),
      modelConstructCount: 0,
      updateModelCount: 0,
      rebuildCount: 0,
      recalculateCount: 0,
      revalidateCount: 0,
      lastUpdateAt: null,
      lastCycle: null,
    };
  }

  getDebugInfo(options = {}) {
    const info = {
      ...this.debugInfo,
      constructed: this.modelConstructed,
      inited: this.inited,
      instanceCount: this.instances.length,
      modelItemCount: this.modelItems.length,
      instances: this.instances.map(instance => instance.getDebugInfo?.()),
      modelItems: this.modelItems.map(item => item.getDebugInfo?.()),
    };

    if (options.includeGraphs === true) {
      info.graphs = this.getDebugGraphInfo();
    }

    return info;
  }

  getDebugGraphInfo() {
    return {
      computes: this.computes,
      mainGraph: this.getDebugGraphSummary(this.mainGraph),
      subGraph: this.getDebugGraphSummary(this.subgraph),
    };
  }

  getDebugGraphSummary(graph) {
    if (!graph) {
      return null;
    }

    const nodes = Object.keys(graph.nodes || {});
    const outgoingEdges = graph.outgoingEdges || {};
    const incomingEdges = graph.incomingEdges || {};
    const calculationOrder = this.getDebugGraphOrder(graph);

    return {
      nodeCount: typeof graph.size === 'function' ? graph.size() : nodes.length,
      edgeCount: this.getDebugEdgeCount(outgoingEdges),
      outgoingEdgeCount: this.getDebugEdgeCount(outgoingEdges),
      incomingEdgeCount: this.getDebugEdgeCount(incomingEdges),
      computeNodeCount: nodes.filter(node => typeof node === 'string' && node.includes(':')).length,
      calculationOrderCount: calculationOrder.length,
      calculationOrder: calculationOrder.map((path, index) =>
        this.getDebugGraphNodeInfo(graph, path, index),
      ),
    };
  }

  getDebugGraphOrder(graph) {
    if (!graph || typeof graph.overallOrder !== 'function') {
      return [];
    }

    try {
      return graph.overallOrder(false);
    } catch (error) {
      return [];
    }
  }

  getDebugEdgeCount(edgeMap = {}) {
    return Object.values(edgeMap).reduce((count, edges) => {
      return count + (Array.isArray(edges) ? edges.length : 0);
    }, 0);
  }

  getDebugGraphNodeInfo(graph, path, index = 0) {
    let data = null;

    try {
      data = graph.getNodeData(path);
    } catch (error) {
      data = null;
    }

    const basePath =
      typeof path === 'string' && path.includes(':') ? path.substring(0, path.indexOf(':')) : path;

    const facet =
      typeof path === 'string' && path.includes(':') ? path.substring(path.indexOf(':') + 1) : null;

    const modelItem = this.getModelItem(basePath);

    return {
      index: index + 1,
      path,
      basePath,
      facet,
      isCompute: !!facet,
      ref: modelItem?.ref || null,
      instanceId: modelItem?.instanceId || null,
      value: modelItem?.value,
      dataType: data?.__jsonlens__
        ? 'json-lens'
        : data?.nodeType
          ? 'xml-node'
          : data === null || data === undefined
            ? null
            : typeof data,
      dependencies: graph.outgoingEdges?.[path] || [],
      dependants: graph.incomingEdges?.[path] || [],
    };
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
      // Do not create the model item. It may be exchanged later when create-nodes actually made the node
      return null;
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
      !!targetNode &&
      typeof targetNode === 'object' &&
      typeof targetNode.get === 'function' &&
      typeof targetNode.set === 'function';

    // If ModelItem for same path exists, RETARGET it (node OR lens)
    if (path) {
      const existingModelItem = model._modelItemsByPath.get(path);
      if (existingModelItem) {
        model._setModelItemTarget(
          existingModelItem,
          isLensObject ? { lens: targetNode } : { node: targetNode },
        );
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
    this.debugInfo.modelConstructCount += 1;

    // stale snapshots must not survive a full model (re)construction
    this.undoManager.clear();
    // opt-in: without this attribute the manager stays a no-op and no instance
    // data is ever cloned, so normal (non-undo) forms pay nothing for this feature
    this.undoManager.enabled = this.hasAttribute('undo');
    if (this.hasAttribute('undo-depth')) {
      const depth = Number(this.getAttribute('undo-depth'));
      if (!Number.isNaN(depth) && depth > 0) {
        this.undoManager.maxDepth = depth;
      }
    }

    // this.dispatchEvent(new CustomEvent('model-construct', { detail: this }));
    await Fore.dispatch(this, 'model-construct', { model: this });

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
        // IMPORTANT: For JSON instances, bind RAW JS root so `?` lookup works.
        try {
          const defInst = this.getDefaultInstance();
          if (defInst) {
            const t = (defInst.getAttribute && defInst.getAttribute('type')) || defInst.type;
            bindings.default =
              t === 'json' ? defInst.getInstanceData() : defInst.getDefaultContext();
          }
        } catch (_e) {
          // ignore
        }
        // Also expose $<id> for explicitly id'ed instances
        this.instances.forEach(inst => {
          const explicitId = inst.getAttribute('id');
          if (!explicitId) return;
          // Do not overwrite $default binding; $default remains the first instance
          if (explicitId === 'default') return;

          const t = (inst.getAttribute && inst.getAttribute('type')) || inst.type;
          bindings[explicitId] = t === 'json' ? inst.getInstanceData() : inst.getDefaultContext();
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

  /**
   * Adds a ModelItem to modelItems (if not already present) and keeps the
   * path/node/lens indexes (_modelItemsByPath, _modelItemsByKey) in sync.
   * Safe to call repeatedly for the same item (idempotent).
   */
  _indexModelItem(mi) {
    if (!this.modelItems.includes(mi)) {
      this.modelItems.push(mi);
    }
    if (mi.path) this._modelItemsByPath.set(mi.path, mi);
    const key = mi.node ?? mi.lens;
    if (key != null) this._modelItemsByKey.set(key, mi);
  }

  /**
   * Reassigns a ModelItem's `path` (eg. the repeat-insert "dewey rewrite" that
   * disambiguates a freshly inserted row's subtree) and keeps _modelItemsByPath
   * in sync. This is the single place that changes modelItem.path after initial
   * registration - a direct `mi.path = ...` assignment would leave the path
   * index stale.
   */
  _setModelItemPath(mi, newPath) {
    if (mi.path === newPath) return;
    if (mi.path) this._modelItemsByPath.delete(mi.path);
    mi.path = newPath;
    if (newPath) this._modelItemsByPath.set(newPath, mi);
  }

  /**
   * Removes a ModelItem from modelItems and its indexes.
   */
  _deindexModelItem(mi) {
    const index = this.modelItems.indexOf(mi);
    if (index !== -1) this.modelItems.splice(index, 1);
    if (mi.path) this._modelItemsByPath.delete(mi.path);
    const key = mi.node ?? mi.lens;
    if (key != null) this._modelItemsByKey.delete(key);
  }

  /**
   * Reassigns a ModelItem's backing node/lens (mutually exclusive) and keeps
   * _modelItemsByKey in sync. This is the single place that changes
   * modelItem.node/modelItem.lens after initial registration - any other
   * assignment would leave the key index stale.
   */
  _setModelItemTarget(modelItem, { node = null, lens = null } = {}) {
    const oldKey = modelItem.node ?? modelItem.lens;
    const newKey = lens ?? node;
    if (oldKey !== newKey) {
      if (oldKey != null) this._modelItemsByKey.delete(oldKey);
      if (newKey != null) this._modelItemsByKey.set(newKey, modelItem);
    }
    modelItem.node = node;
    modelItem.lens = lens;
  }

  registerModelItem(modelItem) {
    if (!modelItem) return null;

    const path = modelItem.path;

    const resetComputedState = mi => {
      // Tabula rasa for computed facets; keep identity (boundControls/observers)
      mi.readonly = ModelItem.READONLY_DEFAULT;
      mi.relevant = ModelItem.RELEVANT_DEFAULT;
      mi._parentModelItem = undefined;
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
        this._setModelItemTarget(target, { lens: source.lens });
      } else if (source.node) {
        this._setModelItemTarget(target, { node: source.node });
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
        this._indexModelItem(prev);

        this._prevModelItemsByPath.delete(path);
        return prev;
      }
    }

    // ---- normal path ----
    if (!path) {
      // No path => can't reuse; keep as-is
      this._indexModelItem(modelItem);
      return modelItem;
    }

    const existing = this._modelItemsByPath.get(path);
    if (!existing) {
      // New canonical item
      resetComputedState(modelItem);
      this._indexModelItem(modelItem);
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
    this.debugInfo.updateModelCount += 1;
    this.debugInfo.lastUpdateAt = performance.now();

    this._refreshModelVariables();

    const rebuildStart = performance.now();
    this.rebuild();
    /*
        if (this.skipUpdate){
            console.info('%crecalculate/revalidate skipped - no bindings', 'font-style: italic; background: #90a4ae; color:lightgrey; padding:0.3rem 5rem 0.3rem 0.3rem;display:block;width:100%;');
            return;
        }
*/
    const recalculateStart = performance.now();
    this.recalculate();
    const revalidateStart = performance.now();
    this.revalidate();
    const revalidateEnd = performance.now();

    this.debugInfo.lastCycle = {
      timestamp: revalidateEnd,
      rebuildMs: recalculateStart - rebuildStart,
      recalculateMs: revalidateStart - recalculateStart,
      revalidateMs: revalidateEnd - revalidateStart,
      totalMs: revalidateEnd - rebuildStart,
      computes: this.computes || 0,
      modelItemCount: this.modelItems.length,
    };
  }

  /**
   * Resolves the model whose undo history should record mutations reachable through
   * this model.
   *
   * A model that declares no `<fx-instance>` of its own (e.g. a nested `fx-fore` that
   * only consumes a `shared` instance from an ancestor) operates entirely on data it
   * doesn't own. Its own `undoManager` would only ever see empty snapshots - not
   * merely non-undoable, but silently WRONG: `canUndo()`/`undo()` would still report
   * success against a snapshot that changes nothing. Such a model's undo/redo instead
   * delegates to the nearest ancestor `fx-fore` whose model actually owns instances,
   * mirroring the parent-lookup `getInstance()` uses for `shared` instances.
   *
   * Known gap: a model that owns SOME instances of its own but also mutates a shared
   * instance discovered via `getInstance()`'s broader page-wide search (not a direct
   * ancestor) is not covered here - only the "no instances of my own" case is.
   *
   * @returns {import('./UndoManager.js').UndoManager}
   */
  getEffectiveUndoManager() {
    if (this.instances.length > 0) return this.undoManager;
    const parentFore =
      this.fore.parentNode?.nodeType === Node.DOCUMENT_FRAGMENT_NODE
        ? this.fore.parentNode.host?.closest('fx-fore')
        : this.fore.parentNode?.closest('fx-fore');
    const parentModel = parentFore?.getModel();
    if (parentModel && parentModel !== this) {
      return parentModel.getEffectiveUndoManager();
    }
    return this.undoManager;
  }

  /**
   * restores instance data to the state before the last undoable action chain.
   * Callers are responsible for running updateModel() and a refresh afterwards.
   *
   * @returns {boolean} true if a step was undone
   */
  undo() {
    return this.getEffectiveUndoManager().undo();
  }

  /**
   * re-applies the most recently undone action chain.
   * Callers are responsible for running updateModel() and a refresh afterwards.
   *
   * @returns {boolean} true if a step was redone
   */
  redo() {
    return this.getEffectiveUndoManager().redo();
  }

  canUndo() {
    return this.getEffectiveUndoManager().canUndo();
  }

  canRedo() {
    return this.getEffectiveUndoManager().canRedo();
  }

  /**
   * (Recursively) remove the model item of a node.
   * @param {Node} node - The node for which to remove the model item
   */
  removeModelItem(node) {
    if (!node) return;

    // Support both XML nodes (mi.node) and JSON lens nodes (mi.lens)
    const mi = this._modelItemsByKey.get(node);

    // The model item is not always there. Might be the case if a node is 'skipped' during rendering.
    // It may still have descendants that can have model items.
    if (mi) {
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

      this._deindexModelItem(mi);
    }

    // Recurse for XML descendants only
    if (node.childNodes) {
      for (const child of Array.from(node.childNodes)) {
        this.removeModelItem(child);
      }
    }
  }

  rebuild() {
    this.debugInfo.rebuildCount += 1;

    // Build a lookup for existing ModelItems so we can reuse them by path (approach A)
    const prevItems = Array.isArray(this.modelItems) ? this.modelItems : [];
    this._prevModelItemsByPath = new Map();
    prevItems.forEach(mi => {
      if (mi && mi.path) this._prevModelItemsByPath.set(mi.path, mi);
    });

    this.mainGraph = new DepGraph(false);
    this.modelItems = [];
    this._modelItemsByPath = new Map();
    this._modelItemsByKey = new Map();

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

    // Lazily created ModelItems (eg. an fx-control/fx-output whose `ref` has no
    // <fx-bind> of its own) never go through bind.init() above, so without this they'd
    // be silently dropped from modelItems on every rebuild. Since UI elements keep a
    // direct reference to their ModelItem, they wouldn't error - they'd just stop being
    // recalculated/notified forever (see fx-update-orphans-control.html). Reclaim any
    // such item whose backing node is still attached to its instance document.
    this._prevModelItemsByPath.forEach(mi => {
      if (!mi.isSynthetic) return;
      if (!mi.node || !mi.node.isConnected) return;
      this._indexModelItem(mi);
    });

    // Drop remaining unused previous ModelItems (not re-registered this rebuild)
    this._prevModelItemsByPath = null;

    Fore.dispatch(this, 'rebuild-done', { maingraph: this.mainGraph });
  }
  /**
   * recalculation of all modelItems. Uses dependency graph to determine order of computation.
   *
   * todo: use 'changed' flag on modelItems to determine subgraph for recalculation. Flag already exists but is not used.
   */
  /**
   * XForms 2.0: model variables are evaluated in document order immediately before
   * rebuild, recalculate and refresh — never reactively in between. Called from
   * updateModel() (before rebuild) and recalculate(), which covers both update paths
   * (actions run recalculate/revalidate/refresh without updateModel).
   *
   * The dependency graph is variable-blind: facet expressions referencing $var have
   * no edge to the nodes the variable reads. When a model variable changed at this
   * evaluation point, coarsely invalidate by clearing `changed` so recalculate runs
   * the full graph instead of the changed-nodes subgraph.
   *
   * @private
   */
  _refreshModelVariables() {
    let modelVariablesChanged = false;
    this.querySelectorAll('fx-var').forEach(variable => {
      if (typeof variable.refreshAndReportChange === 'function') {
        if (variable.refreshAndReportChange()) {
          modelVariablesChanged = true;
        }
      }
    });
    if (modelVariablesChanged) {
      this.changed = [];
    }
  }

  async recalculate() {
    this.debugInfo.recalculateCount += 1;
    if (!this.mainGraph) {
      return;
    }

    this._refreshModelVariables();

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
      await Fore.dispatch(this, 'recalculate-done', {
        graph: this.subgraph,
        computes: this.computes,
      });
    } else {
      const v = this.mainGraph.overallOrder(false);
      v.forEach(path => {
        const node = this.mainGraph.getNodeData(path);
        this.compute(node, path);
      });
      await Fore.dispatch(this, 'recalculate-done', {
        graph: this.mainGraph,
        computes: this.computes,
      });
    }
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

  _getNativeValidity(widget) {
    if (!widget?.validity) return true;

    let nativeValid = widget.validity.valid;

    // Browsers do not consistently report minlength/maxlength violations
    // for values assigned programmatically. Fore values are often updated
    // programmatically, so enforce these two constraints explicitly.
    const value = widget.value ?? '';

    const minlength = widget.getAttribute('minlength');
    if (minlength !== null && value !== '') {
      const min = Number.parseInt(minlength, 10);
      if (!Number.isNaN(min) && value.length < min) {
        nativeValid = false;
      }
    }

    const maxlength = widget.getAttribute('maxlength');
    if (maxlength !== null) {
      const max = Number.parseInt(maxlength, 10);
      if (!Number.isNaN(max) && value.length > max) {
        nativeValid = false;
      }
    }

    return nativeValid;
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
    this.debugInfo.revalidateCount += 1;
    if (this.modelItems.length === 0) return true;

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
    // Native browser constraint validation — read ValidityState without side-effects.
    // widget.validity.valid is a live property; no events are fired (unlike checkValidity()).
    // Use querySelector instead of getWidget() to avoid DOM mutation (getWidget creates a
    // fallback input if none exists).
    this.fore.querySelectorAll('fx-control').forEach(control => {
      if (!control.modelItem) return;
      const widget = control.querySelector('.widget, input');
      if (!widget?.validity) return;
      const nativeValid = this._getNativeValidity(widget);
      if (control.modelItem.nativeValid !== nativeValid) {
        control.modelItem.nativeValid = nativeValid;
        control.modelItem.notify();
      }
      if (!nativeValid) valid = false;
    });

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
      const key = nodeOrPath.includes(':')
        ? nodeOrPath.substring(0, nodeOrPath.indexOf(':'))
        : nodeOrPath;
      return this._modelItemsByPath.get(key) ?? null;
    }

    // Node/lens lookup
    return this._modelItemsByKey.get(nodeOrPath) ?? null;
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

  /**
   * Reverse-lookup: given an XML node, find the id of the fx-instance whose document owns it.
   *
   * Used to canonicalize the path of a node referenced *across instances* (e.g. a `relevant`
   * expression on a bind in instance A that reads a node from instance B) -- the referenced
   * node's own instance id must be used, not the id of the instance the bind itself is on.
   *
   * @param {Node} node
   * @returns {string|null}
   */
  getInstanceIdForNode(node) {
    if (!node || node.nodeType === undefined) return null;
    const doc = node.nodeType === Node.DOCUMENT_NODE ? node : node.ownerDocument;
    if (!doc) return null;

    const match = Array.from(this.instances).find(inst => inst.getInstanceData?.() === doc);
    return match ? match.id : null;
  }
}

if (!customElements.get('fx-model')) {
  customElements.define('fx-model', FxModel);
}
