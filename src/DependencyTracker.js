import { DepGraph } from './dep_graph.js';
import getInScopeContext from './getInScopeContext';
import { XPathUtil } from './xpath-util';
import { TemplateBinding } from './binding/TemplateBinding.js';
import { evaluateXPath, evaluateXPathToNodes } from './xpath-evaluation';
import { debounce } from './events';
import { DependencyNotifyingDomFacade } from './DependencyNotifyingDomFacade.js';
// import { XPathDependencyExtractor } from './XPathDependencyExtractor.js';
let _instance = null;

export class DependencyTracker {
    constructor() {
        // Enforce singleton
        if (_instance) {
            return _instance;
        }
        _instance = this;

        // Remove old controlBindings; use a unified registry instead.
        // this.controlBindings = new Map();
        this.bindingRegistry = new Map(); // Map of compositeKey -> Set of binding objects.
        this.bindingsByType = {
            node: new Set(), // e.g. NodeBinding (formerly modelBinding)
            facet: new Set(), // FacetBinding (for calculate, readonly, relevant, etc.)
            template: new Set(), // TemplateBinding
            control: new Set(), // ControlBinding
            repeat: new Set(), // RepeatBinding
        };

        this.dependencyGraph = new DepGraph(); // Directed graph for dependencies

        this.pendingUpdates = new Set(); // Collects bindings that need updating
        this.nonRelevantControls = new Set(); // Tracks non-relevant controls (or bindings)
        this.reactivatedControls = new Set(); // Tracks controls that became relevant again
        this.updateCycle = new Set(); // Tracks updates per cycle to avoid redundant updating
        this.repeatIndexMap = new Map(); // Tracks index() function values for repeated controls
        // this.hierarchicalDependencies = new Map(); // Tracks complex XPath dependencies
        this.deletedIndexes = new Map(); // Tracks deleted indexes for fx-repeat
        this.insertedIndexes = new Map(); // Tracks inserted indexes for fx-repeat
        this.storedTemplateExpressions = [];
        this.queuedChanges = new Set();
        // this.xpathExtractor = new XPathDependencyExtractor(); // Extractor for dependencies

        // Create the debounced version of our internal notifyChange method.
        this.debouncedNotifyChange = debounce(this, this._notifyChange, 100);
        this.opNum = 0; // global number of operations
    }

    reset() {
        this.bindingRegistry.clear();
        this.bindingsByType.node.clear();
        this.bindingsByType.facet.clear();
        this.bindingsByType.template.clear();
        this.bindingsByType.control.clear();
        this.bindingsByType.repeat.clear();
        this.dependencyGraph = new DepGraph();
        this.pendingUpdates.clear();
        this.nonRelevantControls.clear();
        this.reactivatedControls.clear();
        this.repeatIndexMap.clear();
        this.deletedIndexes.clear();
        this.insertedIndexes.clear();
        this.queuedChanges.clear();
        this.storedTemplateExpressions = null;
    }

    /**
     * @returns {DependencyTracker}
     */
    static getInstance() {
        if (!_instance) {
            _instance = new DependencyTracker();
        }
        return _instance;
    }

    /**
     *
     * Given an array or set of changed keys (model item keys), this method builds a subgraph
     * that includes all affected nodes (including dependents) and returns a topologically sorted list of keys.
     *
     * @param {Set|string[]} changedKeys - A set (or array) of keys that have been changed.
     * @returns {string[]} - An ordered list of composite keys in dependency order.
     */
    /**
     * Build a subgraph of the changed nodes based on the pendingUpdates set.
     * Each binding in pendingUpdates is assumed to have a .key property (its composite key).
     * This method builds a subgraph from those keys and any dependents from the main dependency graph,
     * then returns a topologically sorted list of keys.
     *
     * @returns {DepGraph} - The sub graph that should be updated to reach a new state
     */
    buildSubgraphForPendingChanges() {
        const subgraph = new DepGraph(false);

        // Iterate over the bindings in pendingUpdates.
        this.pendingUpdates.forEach((binding) => {
            // we only want Node and FacetBindings now
            // if(binding instanceof NodeBinding || binding instanceof FacetBinding){
            if (
                binding.bindingType === 'node' ||
                binding.bindingType === 'facet'
            ) {
                const key = binding.xpath;
                // Add the changed key to the subgraph.
                subgraph.addNode(key, this.dependencyGraph.getNodeData(key));

                // If the main dependency graph has this key,
                // add all its dependents to the subgraph.
                if (this.dependencyGraph.hasNode(key)) {
                    const allDependents = this.dependencyGraph.dependantsOf(
                        key,
                        false,
                    );
                    // Optionally reverse the order if needed.
                    // const dependents = allDependents.reverse();
                    allDependents.forEach((dep) => {
                        subgraph.addNode(
                            dep,
                            this.dependencyGraph.getNodeData(dep),
                        );
                        // Add an edge from the changed key to this dependent.
                        subgraph.addDependency(key, dep);
                    });
                }
            }
        });

        // Return the overall ordered keys (topologically sorted).
        return subgraph;
    }

    /**
     * Unified registration for any binding.
     * @param {string} key - The composite key for the binding (for example, "foo:readonly" or "$default")
     * @param {import('./binding/Binding.js').Binding} binding - The binding object to register.
     * @param {boolean} shouldInvalidateImmediately - Whether the binding should be updated
     * immediately. Facets (like calculate) should be invalidated and recomputed right away
     */
    registerBinding(key, binding, shouldInvalidateImmediately = false) {
        if (!this.bindingRegistry.has(key)) {
            console.log('🔗 registerBinding', key, binding);
            this.bindingRegistry.set(key, new Set());
            // Also add the key as a node in the dependency graph if needed.
            if (!this.dependencyGraph.hasNode(key)) {
                this.dependencyGraph.addNode(key, binding);
            }
        }
        const bindingSet = this.bindingRegistry.get(key);
        if (bindingSet.has(binding)) {
            console.warn(
                `⚠️ Warning: Attempting to register duplicate binding for key '${key}'.`,
                binding,
            );
        } else {
            bindingSet.add(binding);
        }
        // this.bindingRegistry.get(key).add(binding);
        // Also index by type if available
        if (binding.bindingType && this.bindingsByType[binding.bindingType]) {
            this.bindingsByType[binding.bindingType].add(binding);
        }

        if (shouldInvalidateImmediately) {
            // Also, invalidate bindings immediately. Do not compute them right away since the
            // calculation order may depend on intricate dependencies (a->c->b). The Graph will figure
            // that order of calculation out later
            this.pendingUpdates.add(binding);
        }
    }

    /**
     * Register a control (or container) that holds a binding.
     * (This is used by fx-control elements or similar.)
     * @param {string} refXPath - The XPath string (relative or absolute)
     * @param {import('./binding/ControlBinding.js').ControlBinding} control - The control element.
     */
    registerControl(refXPath, control) {
        let resolvedXPath;
        if (XPathUtil.isAbsolutePath(refXPath)) {
            resolvedXPath = this.resolveInstanceXPath(refXPath);
        } else {
            const inscope = getInScopeContext(control.control, refXPath);
            const scopeXPath = XPathUtil.getCanonicalXPath(inscope);
            resolvedXPath = scopeXPath
                ? `${scopeXPath}/${refXPath}`
                : this.resolveInstanceXPath(refXPath);
        }

        this.registerBinding(resolvedXPath, control);

        // If a change was queued for this XPath, process it now.
        if (this.queuedChanges.has(resolvedXPath)) {
            console.log(`Processing queued change for: ${resolvedXPath}`);
            this.queuedChanges.delete(resolvedXPath);
            this.notifyChange(resolvedXPath); // Call notifyChange now that control is ready.
        }
    }

    /**
     * Registers a Node holding a template expression.
     * @param {string} expression - The XPath template expression.
     * @param {Node} node - The DOM Node that holds the template expression.
     */
    registerTemplateBinding(expression, node) {
        console.log(
            `🔗 Registering Template Expression: {${expression}}`,
            node,
        );

        const parent =
            node.nodeType === Node.ATTRIBUTE_NODE
                ? node.ownerElement
                : node.parentNode;
        if (parent.closest('fx-model')) return;
        const templateBinding = new TemplateBinding(expression, node);
        this.registerBinding(templateBinding.xpath, templateBinding);

        const deps = [];
        const dependencyTrackingDomFacade = new DependencyNotifyingDomFacade(
            (_node) => undefined,
            ({ dependencyKind, repeat }) => {
                if (dependencyKind === 'repeat-index') {
                    deps.push({ kind: 'repeat-index', repeat: repeat });
                }
            },
        );
        const inscope = getInScopeContext(node, expression);

        const targetNode = evaluateXPath(
            expression,
            inscope,
            node,
            null,
            {},
            dependencyTrackingDomFacade,
        );

        if (targetNode[0]?.nodeType) {
            // Line up a dependency from the Template expression to resulting node.
            // TODO: set up the dependencies to all the nodes touched as well!
            DependencyTracker.getInstance().registerDependency(
                templateBinding.xpath,
                XPathUtil.getCanonicalXPath(targetNode[0]),
            );
        }

        for (const dep of deps) {
            // Set up the dependencies from the template binding to all the repeat-indexes used in the XPath
            DependencyTracker.getInstance().registerDependency(
                templateBinding.xpath,
                dep.repeat,
            );
        }

        // Register dependencies for the template binding.
        /*       const dependencies = this.extractDependencies(expression);
        dependencies.forEach((dep) => {
            console.log(`🔗 Template depends on: ${dep}`);
            this.registerBinding(dep, templateBinding);
        });
 */ // Also register under a default key.
        // this.registerBinding('$default', templateBinding);

        // Evaluate the template immediately.
        templateBinding.update();
    }

    // Register a dependency edge in the dependency graph.
    /**
     * @param {string} from
     * @param {string} to
     */
    registerDependency(from, to) {
        console.log('🔗🔗 registerDependency', from, to);
        if (!this.dependencyGraph.hasNode(from)) {
            this.dependencyGraph.addNode(from);
        }
        if (!this.dependencyGraph.hasNode(to)) {
            this.dependencyGraph.addNode(to);
        }
        // this.dependencyGraph.addDependency(from,to);
        this.dependencyGraph.addDependency(from, to);

        // Handle complex axes relationships.
        // this.trackHierarchicalDependency(from, to);
    }

    /*
    trackHierarchicalDependency(sourceXPath, dependentXPath) {
        if (!this.hierarchicalDependencies.has(sourceXPath)) {
            this.hierarchicalDependencies.set(sourceXPath, new Set());
        }
        this.hierarchicalDependencies.get(sourceXPath).add(dependentXPath);
    }
*/

    resolveInstanceXPath(xpath) {
        // Replace instance() calls
        console.log('resolveInstanceXPath', xpath);
        xpath = xpath.replace(
            /instance\(['"]?([^'"\)]*)['"]?\)/g,
            (_, instanceId) => `$${instanceId || 'default'}/`,
        );

        // Ensure absolute and relative paths without instance() get prefixed with $default
        if (!xpath.startsWith('$') && !xpath.startsWith('.')) {
            xpath = `$default/${xpath}`;
        }

        // Normalize multiple consecutive slashes (e.g., "///" -> "/")
        xpath = xpath.replace(/\/+/g, '/');

        return xpath;
    }

    getBaseXPath(xpath) {
        const lastPredicateIndex = xpath.lastIndexOf('[');
        if (lastPredicateIndex !== -1 && xpath.endsWith(']')) {
            return xpath.substring(0, lastPredicateIndex);
        }
        return xpath;
    }

    updateRepeatIndex(xpath, newIndex) {
        console.log('updateRepeatIndex', xpath, newIndex);
        const resolvedXPath = this.resolveInstanceXPath(xpath);
        const oldIndex = this.repeatIndexMap.get(resolvedXPath);
        if (oldIndex !== newIndex) {
            this.repeatIndexMap.set(resolvedXPath, newIndex);
            this.notifyIndexChange(resolvedXPath, oldIndex, newIndex);
            // repeats listen on the basePath so cut off the resolvedPath
            // const basePath = this.getBaseXPath(resolvedXPath);
            // this.notifyIndexChange(basePath, oldIndex, newIndex);
        }
    }

    /**
     *
     *
     * @param changedXPath
     * @private
     */
    notifyChange(changedXPath) {
        console.log('throttling notifyChange', changedXPath);
        this._notifyChange(changedXPath);
    }

    /**
     * debounced version of notifyChange - should only be called from notifyChange.
     *
     * @param changedXPath
     * @private
     */
    _notifyChange(changedXPath) {
        const resolvedXPath = this.resolveInstanceXPath(changedXPath);
        const affectedXPaths = new Set([resolvedXPath]);

        // If no binding is registered for this XPath, queue the change.
        if (!this.bindingRegistry.has(resolvedXPath)) {
            console.warn(
                `No bindings yet for: ${resolvedXPath}, queuing change.`,
            );
            //      this.queuedChanges.add(resolvedXPath);
            //      return;
        }

        this.bindingRegistry.forEach((bindings, key) => {
            // Handle wildcard dependencies.
            if (key.endsWith('/*')) {
                const parentPath = key.slice(0, -2);
                if (resolvedXPath.startsWith(parentPath)) {
                    affectedXPaths.add(key);
                }
            }
            // Handle parent (`..`) dependencies.
            if (key.includes('..')) {
                const parentPath = key.replace('..', '');
                if (resolvedXPath.startsWith(parentPath)) {
                    affectedXPaths.add(key);
                }
            }
        });

        /*
        this.bindingRegistry.forEach((bindings, key) => {
            // Handle parent (`..`) dependencies.
            if (key.includes('..')) {
                const parentPath = key.replace('..', '');
                if (resolvedXPath.startsWith(parentPath)) {
                    affectedXPaths.add(key);
                }
            }
        });
*/

        // Standard dependency resolution from the dependencyGraph.
        if (this.dependencyGraph.hasNode(resolvedXPath)) {
            const dependents = this.dependencyGraph.dependantsOf(resolvedXPath);
            dependents.forEach((dep) => affectedXPaths.add(dep));
        }

        // Hierarchical dependencies.
        /*
        if (this.hierarchicalDependencies.has(resolvedXPath)) {
            for (let dependentXPath of this.hierarchicalDependencies.get(resolvedXPath)) {
                affectedXPaths.add(dependentXPath);
            }
        }
*/

        // Add affected bindings to pendingUpdates.
        for (const affectedXPath of affectedXPaths) {
            if (this.bindingRegistry.has(affectedXPath)) {
                for (const binding of this.bindingRegistry.get(affectedXPath)) {
                    if (!this.nonRelevantControls.has(binding)) {
                        this.pendingUpdates.add(binding);
                    }
                }
            }
        }

        // Optionally, update template bindings in the scope of pending items.
        /*
        for (const binding of this.pendingUpdates) {
            if (binding.templateBindings) {
                for (const tb of binding.templateBindings) {
                    console.log(
                        `Updating template expression within scope: ${tb.expression}`,
                    );
                    tb.update();
                }
            }
        }
*/

        // console.log('after notifyChange', this.pendingUpdates);
    }

    notifyDelete(xpath) {
        console.log('❌ notifyDelete', xpath);
        const resolvedXPath = this.resolveInstanceXPath(xpath);
        const matches = [...resolvedXPath.matchAll(/\[(\d+)\]/g)];
        const baseXPath = resolvedXPath.replace(/\[\d+\]$/, '');
        if (matches.length > 0) {
            const index = parseInt(matches[matches.length - 1][1], 10);
            if (!this.deletedIndexes.has(baseXPath)) {
                this.deletedIndexes.set(baseXPath, []);
            }
            this.deletedIndexes.get(baseXPath).push(index);
            if (this.bindingRegistry.has(baseXPath)) {
                for (const binding of this.bindingRegistry.get(baseXPath)) {
                    if (!this.nonRelevantControls.has(binding)) {
                        this.pendingUpdates.add(binding);
                    }
                }
            }
        }
        if (this.bindingRegistry.has(resolvedXPath)) {
            this.bindingRegistry.get(resolvedXPath).forEach((binding) => {
                this.pendingUpdates.add(binding);
            });
        }
        if (this.dependencyGraph.hasNode(resolvedXPath)) {
            const dependents = this.dependencyGraph.dependantsOf(resolvedXPath);
            dependents.forEach((dep) => this.notifyChange(dep));
        }
        if (this.dependencyGraph.hasNode(baseXPath)) {
            const dependents = this.dependencyGraph.dependantsOf(baseXPath);
            dependents.forEach((dep) => this.notifyChange(dep));
        }
    }

    /**
     * @param {import('./modelitem.js').ModelItem} modelItem - The model item of the node that was just inserted
     */
    notifyInsert(modelItem) {
        const xpath = `${modelItem.path}_${this.opNum}`;
        console.log('notifyInsert', modelItem);
        this.opNum++;

        const resolvedXPath = this.resolveInstanceXPath(modelItem.path);
        modelItem.path = xpath;

        const matches = [...resolvedXPath.matchAll(/\[(\d+)\]/g)];
        const baseXPath = resolvedXPath.replace(/\[\d+\]$/, '');
        if (matches.length > 0) {
            const index = parseInt(matches[matches.length - 1][1], 10);
            if (!this.insertedIndexes.has(baseXPath)) {
                this.insertedIndexes.set(baseXPath, []);
            }
            this.insertedIndexes.get(baseXPath).push(index);
            // make sure the repeat will refresh by adding to pendingUpdates
            if (this.bindingRegistry.has(baseXPath)) {
                for (const binding of this.bindingRegistry.get(baseXPath)) {
                    if (!this.nonRelevantControls.has(binding)) {
                        this.pendingUpdates.add(binding);
                    }
                }
            }
        }

        // create and register modelItem and Binding
        // const newPath = `${resolvedXPath}_${this.opNum}`;
        // this.registerBinding(newPath,new Binding(newPath,'control'));
        // this.queuedChanges.add(newPath);

        if (this.bindingRegistry.has(resolvedXPath)) {
            this.bindingRegistry.get(resolvedXPath).forEach((binding) => {
                this.nonRelevantControls.delete(binding);
                this.reactivatedControls.add(binding);
                this.pendingUpdates.add(binding);
            });
        }
        // Process dependencies from the graph.
        if (this.dependencyGraph.hasNode(resolvedXPath)) {
            const dependents = this.dependencyGraph.dependantsOf(resolvedXPath);
            dependents.forEach((dep) => this.notifyChange(dep));
        }
        if (this.dependencyGraph.hasNode(baseXPath)) {
            const dependents = this.dependencyGraph.dependantsOf(baseXPath);
            dependents.forEach((dep) => this.notifyChange(dep));
        }
    }

    getDeletedIndexes(ref) {
        return this.deletedIndexes.get(ref) || [];
    }

    getInsertedIndexes(ref) {
        return this.insertedIndexes.get(ref) || [];
    }

    notifyIndexChange(xpath, oldIndex, newIndex) {
        console.log('notifyIndexChange', xpath, newIndex);
        if (this.bindingRegistry.has(xpath)) {
            for (const binding of this.bindingRegistry.get(xpath)) {
                if (!this.nonRelevantControls.has(binding)) {
                    this.pendingUpdates.add(binding);
                }
            }
        }

        /*
        console.log(
            'notifyIndexChange pendingUpdates',
            Array.from(this.pendingUpdates),
        );
*/
    }

    markNonRelevant(binding) {
        console.log('markNonRelevant', binding);
        this.nonRelevantControls.add(binding);
        this.pendingUpdates.delete(binding);
    }

    markRelevant(binding) {
        console.log('markRelevant', binding);
        if (this.nonRelevantControls.has(binding)) {
            this.nonRelevantControls.delete(binding);
            this.reactivatedControls.add(binding);
        }
    }

    evaluateAllTemplateBindings() {
        console.log('Evaluating all registered template bindings...');
        // Iterate through bindings of type 'template'
        if (this.bindingsByType.template) {
            if (this.bindingsByType.template.size === 0) return; // nothing to do
            this.bindingsByType.template.forEach((binding) => binding.update());
        }
    }

    evaluateTemplateExpressions(key) {
        if (this.bindingRegistry.has(key)) {
            const templatebindings =
                this.bindingRegistry.get(key).templateBindings;
            Array.from(templatebindings).forEach((tb) => {
                console.log(
                    `Updating template expression within scope: ${tb.expression}`,
                );
                tb.update();
            });
        }
    }

    updateUnboundTemplates() {
        // update any template bindings registered as 'unbound:template'
        if (this.bindingRegistry.has('unbound:template')) {
            for (const binding of this.bindingRegistry.get(
                'unbound:template',
            )) {
                if (typeof binding.update === 'function') {
                    console.log(
                        `🔄 Updating template expression in unbound scope: ${binding.expression}`,
                    );
                    binding.update();
                }
            }
        }
    }

    processUpdates() {
        console.log(
            'processUpdates pendingUpdates',
            Array.from(this.pendingUpdates),
        );
        console.log(
            'processUpdates deletedIndexes',
            Array.from(this.deletedIndexes),
        );
        console.log(
            'processUpdates insertedIndexes',
            Array.from(this.insertedIndexes),
        );

        this.updateUnboundTemplates();

        let passCount = 0;
        const maxPasses = 10; // guard to prevent infinite loops

        while (this.hasUpdates() && passCount < maxPasses) {
            passCount++;
            this.reactivatedControls.forEach((item) =>
                this.pendingUpdates.add(item),
            );
            this.reactivatedControls.clear();

            const itemToUpdate = [...this.pendingUpdates].filter(
                (item) => !this.nonRelevantControls.has(item),
            );
            this.pendingUpdates.clear();
            this.updateCycle.clear();

            for (const item of itemToUpdate) {
                if (!this.updateCycle.has(item)) {
                    this.updateCycle.add(item);
                    console.log('Updating item:', item);
                    if (typeof item.update === 'function') {
                        item.update();
                    } else if (item.templateBindings) {
                        for (const tb of item.templateBindings) {
                            console.log(
                                `🔄 Updating template expression: ${tb.expression}`,
                            );
                            tb.update();
                        }
                    }
                }
            }
        }

        if (passCount >= maxPasses) {
            console.warn(
                '⚠️ Max pass limit reached — possible infinite update loop!',
            );
        }
        // this.deletedIndexes.clear();
        // this.insertedIndexes.clear();
    }

    hasModelUpdates() {
        return Array.from(this.pendingUpdates).some(
            (binding) =>
                binding.bindingType === 'node' ||
                binding.bindingType === 'facet',
        );
    }

    hasUpdates() {
        // return this.pendingUpdates.size > 0 || this.reactivatedControls.size > 0;
        return Array.from(this.pendingUpdates).some(
            (binding) =>
                binding.bindingType === 'control' ||
                binding.bindingType === 'template' ||
                binding.bindingType === 'facet' ||
                binding.bindingType === 'repeat',
        );
    }

    extractDependencies(expression) {
        const dependencies = new Set();
        const regex =
            /(?:instance\(['"]?([^'"\)]*)['"]?\))?([a-zA-Z_][\w/-]*)/g;
        let match;
        while ((match = regex.exec(expression)) !== null) {
            const fullPath = match[0];
            dependencies.add(fullPath);
        }
        return dependencies;
    }
}
