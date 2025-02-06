import {DepGraph} from './dep_graph.js';
import getInScopeContext from "./getInScopeContext";
import {XPathUtil} from "./xpath-util";
import {TemplateBinding} from "./ui/TemplateBinding.js";
// import { XPathDependencyExtractor } from './XPathDependencyExtractor.js';
let _instance = null;

/**
 * Holds a mapping of a canonical XPath to a Control
 *
 */
class Binding {
    constructor(path, control) {
        this.path = path;
        this.node = control;
    }
}


/**
 * Tracks all bindings between Nodes in the data to controls (in the broad sense) in the UI.
 *
 * This is a singleton class meaning there's only one instance of it in a page no matter how many fx-fore
 * might exist.
 *
 * DependencyTracker uses 2 main structures:
 * - nodeBindings which is a WeakMap for holding pure node:control bindings
 * - controlBindings holding all bound controls after initialization using a canonical xpath as key
 *
 * This is a hybrid approach to on the one hand allow to use auto GC'd node references but further allow XPath
 * analysis for optimizing statements.
 *
 *
 */
export class DependencyTracker {
    constructor() {
        // Enforce singleton
        if (_instance) {
            return _instance;
        }
        _instance = this;

        /**
         * Originally, the idea behind nodeBindings (a WeakMap) was to:
         *
         * - Automatically track bindings to DOM nodes, allowing GC cleanup.
         * - Allow quick lookups by node reference, rather than always using XPath.
         * - Help in resolving template expressions, especially when those are stored on text nodes or attributes.
         *
         * @type {WeakMap<WeakKey, any>}
         */
        this.nodeBindings = new WeakMap(); // A WeakMap from Node -> Binding so GC can clean up
        this.controlBindings = new Map(); // Maps XPath expressions to bound UI controls
        this.dependencyGraph = new DepGraph(); // Directed graph for dependencies
        this.pendingUpdates = new Set(); // Collects controls that need refreshing
        this.nonRelevantControls = new Set(); // Tracks non-relevant controls
        this.reactivatedControls = new Set(); // Tracks controls that became relevant again
        this.updateCycle = new Set(); // Tracks updates per cycle to avoid redundant refreshes
        this.repeatIndexMap = new Map(); // Tracks index() function values for repeated controls
        this.hierarchicalDependencies = new Map(); // Tracks complex XPath dependencies
        this.deletedIndexes = new Map(); // Tracks deleted indexes for fx-repeat
        this.insertedIndexes = new Map(); // Tracks inserted indexes for fx-repeat
        this.storedTemplateExpressions = [];
        this.queuedChanges = new Set();
        // this.xpathExtractor = new XPathDependencyExtractor(); // Extractor for dependencies
    }

    static getInstance() {
        if (!_instance) {
            _instance = new DependencyTracker();
        }
        return _instance;
    }

    /**
     * Register a control or a Node holding a Template Expression.
     * Supports <fx-control> elements and template expressions.
     *
     * When refXPath is be given relative it will be resolved via getInscopeContext.
     *
     * @param refXPath can be either relative or absolute canonical path
     * @param {ForeElementMixin} control a control (including container controls)
     */
    register(refXPath, control) {
        let resolvedXPath;

        if (XPathUtil.isAbsolutePath(refXPath)) {
            resolvedXPath = refXPath;
        } else {
            const inscope = getInScopeContext(control.parentNode, refXPath);
            const scopeXPath = XPathUtil.getCanonicalXPath(inscope);
            resolvedXPath = scopeXPath ? `${scopeXPath}/${refXPath}` : this.resolveInstanceXPath(refXPath);
        }

        console.log('Registering XPath', resolvedXPath, control);

        // Store in WeakMap (automatic cleanup when node is removed)
        const bindingInfo = new Binding(resolvedXPath, control);
        this.nodeBindings.set(control, bindingInfo);

        // Store in path-based controlBindings for dependency analysis
        if (!this.controlBindings.has(resolvedXPath)) {
            this.controlBindings.set(resolvedXPath, new Set());
        }
        this.controlBindings.get(resolvedXPath).add(control);

        // If a change was queued for this XPath, process it now
        if (this.queuedChanges.has(resolvedXPath)) {
            console.log(`Processing queued change for: ${resolvedXPath}`);
            this.queuedChanges.delete(resolvedXPath);
            this.notifyChange(resolvedXPath); // 🔄 Call notifyChange now that control is ready
        }
    }

    /**
     * registers a Node of the UI with an associate expression
     * @param expression XPath expression
     * @param node DOM Node having a template expression
     */
    registerTemplateBinding(expression, node) {
        console.log(`Registering Template Expression: ${expression}`, node);

        // 1️⃣ Extract all variable dependencies from the expression
        const dependencies = this.extractDependencies(expression);

        // 2️⃣ Store the binding using the node itself as a reference (no absolute XPath needed)
        const bindingInfo = new TemplateBinding(expression, node);
        this.nodeBindings.set(node, bindingInfo);

        // 3️⃣ Register each dependency in controlBindings to track changes
        dependencies.forEach(dep => {
            console.log(`Template depends on: ${dep}`);

            if (!this.controlBindings.has(dep)) {
                this.controlBindings.set(dep, new Set());
            }
            this.controlBindings.get(dep).add(bindingInfo);
        });
    }

    getBindingInfo(node) {
        return this.nodeBindings.get(node) || null;
    }

    // Register a dependency in the graph
    registerDependency(sourceXPath, dependentXPath) {
        console.log('registerDependency', sourceXPath, dependentXPath);
        if (!this.dependencyGraph.hasNode(sourceXPath)) {
            this.dependencyGraph.addNode(sourceXPath);
        }
        if (!this.dependencyGraph.hasNode(dependentXPath)) {
            this.dependencyGraph.addNode(dependentXPath);
        }
        this.dependencyGraph.addDependency(sourceXPath, dependentXPath);

        // Handle complex axes relationships
        this.trackHierarchicalDependency(sourceXPath, dependentXPath);
    }

    // Track complex XPath dependencies
    trackHierarchicalDependency(sourceXPath, dependentXPath) {
        if (!this.hierarchicalDependencies.has(sourceXPath)) {
            this.hierarchicalDependencies.set(sourceXPath, new Set());
        }
        this.hierarchicalDependencies.get(sourceXPath).add(dependentXPath);
    }

    // Handle instance() function cases where the absolute path is needed
    resolveInstanceXPath(xpath) {
        // console.log(`Resolving XPath: ${xpath}`);

        // Ensure we handle multiple instances in the same XPath
        return xpath.replace(/instance\(['"]?([^'"\)]*)['"]?\)/g, (_, instanceId) => {
            return `$${instanceId || 'default'}`;
        });
    }

    // Track index() changes for repeated controls
    updateRepeatIndex(xpath, newIndex) {
        console.log('updateRepeatIndex', xpath, newIndex);
        const resolvedXPath = this.resolveInstanceXPath(xpath);
        const oldIndex = this.repeatIndexMap.get(resolvedXPath);
        if (oldIndex !== newIndex) {
            this.repeatIndexMap.set(resolvedXPath, newIndex);
            this.notifyIndexChange(resolvedXPath, oldIndex, newIndex);
        }
    }

    // Notify changes and propagate through the dependency graph
    notifyChange(changedXPath) {
        console.log('notifyChange', changedXPath);
        const resolvedXPath = this.resolveInstanceXPath(changedXPath);
        const affectedXPaths = new Set([resolvedXPath]);

        /*
            If no registered control exists yet, queue the change.
            This may happen when calculations run at init time.
         */
        if (!this.controlBindings.has(resolvedXPath)) {
            console.warn(`No controlBindings yet for: ${resolvedXPath}, queuing change.`);
            this.queuedChanges.add(resolvedXPath);
            return;
        }
        // Handle wildcard dependencies
        this.controlBindings.forEach((_, key) => {
            if (key.endsWith("/*")) {
                const parentPath = key.slice(0, -2);
                if (resolvedXPath.startsWith(parentPath)) {
                    affectedXPaths.add(key);
                }
            }
        });

        // Handle parent (`..`) dependencies
        this.controlBindings.forEach((_, key) => {
            if (key.includes("..")) {
                const parentPath = key.replace("..", "");
                if (resolvedXPath.startsWith(parentPath)) {
                    affectedXPaths.add(key);
                }
            }
        });

        // Standard dependency resolution
        if (this.dependencyGraph.hasNode(resolvedXPath)) {
            const dependents = this.dependencyGraph.dependantsOf(resolvedXPath);
            dependents.forEach(dep => affectedXPaths.add(dep));
        }

        // Handle hierarchical dependencies
        if (this.hierarchicalDependencies.has(resolvedXPath)) {
            for (let dependentXPath of this.hierarchicalDependencies.get(resolvedXPath)) {
                affectedXPaths.add(dependentXPath);
            }
        }

        // todo: handle preceding and following...

        for (let affectedXPath of affectedXPaths) {
            if (this.controlBindings.has(affectedXPath)) {
                for (let binding of this.controlBindings.get(affectedXPath)) {
                    if (binding instanceof TemplateBinding) {
                        console.log(`🔄 Updating template expression: ${binding.expression}`);
                        this.pendingUpdates.add(binding.node);
                    } else {
                        if (!this.nonRelevantControls.has(binding)) {
                            this.pendingUpdates.add(binding);
                        }
                    }
                }
            }
        }
    }

    notifyDelete(xpath) {
        console.log('notifyDelete', xpath);
        const resolvedXPath = this.resolveInstanceXPath(xpath);

        // Extract last positional predicate from XPath
        const matches = [...resolvedXPath.matchAll(/\[(\d+)\]/g)];
        if (matches.length > 0) {
            const index = parseInt(matches[matches.length - 1][1], 10);
            const baseXPath = resolvedXPath.replace(/\[\d+\]$/, '');

            if (!this.deletedIndexes.has(baseXPath)) {
                this.deletedIndexes.set(baseXPath, []);
            }
            this.deletedIndexes.get(baseXPath).push(index);

            // **Add controlling elements for baseXPath to pending updates**
            if (this.controlBindings.has(baseXPath)) {
                for (const control of this.controlBindings.get(baseXPath)) {
                    if (!this.nonRelevantControls.has(control)) {
                        this.pendingUpdates.add(control);
                    }
                }
            }
        }

        // For the fully resolved path (with [3], etc.), mark as nonRelevant
        if (this.controlBindings.has(resolvedXPath)) {
            this.controlBindings.get(resolvedXPath).forEach(control => {
                this.nonRelevantControls.add(control);
                // We can also add it to pendingUpdates so it can do final cleanup if needed
                this.pendingUpdates.add(control);
            });
        }

        if (this.dependencyGraph.hasNode(resolvedXPath)) {
            const dependents = this.dependencyGraph.dependantsOf(resolvedXPath);
            dependents.forEach(dep => this.notifyChange(dep));
        }
    }

    notifyInsert(xpath) {
        console.log('notifyInsert', xpath);
        const resolvedXPath = this.resolveInstanceXPath(xpath);

        // Extract last positional predicate from XPath
        const matches = [...resolvedXPath.matchAll(/\[(\d+)\]/g)];
        if (matches.length > 0) {
            const index = parseInt(matches[matches.length - 1][1], 10);
            const baseXPath = resolvedXPath.replace(/\[\d+\]$/, '');

            if (!this.insertedIndexes.has(baseXPath)) {
                this.insertedIndexes.set(baseXPath, []);
            }
            this.insertedIndexes.get(baseXPath).push(index);

            // **Add controlling elements for baseXPath to pending updates**
            if (this.controlBindings.has(baseXPath)) {
                for (const control of this.controlBindings.get(baseXPath)) {
                    if (!this.nonRelevantControls.has(control)) {
                        this.pendingUpdates.add(control);
                    }
                }
            }
        }

        if (this.controlBindings.has(resolvedXPath)) {
            this.controlBindings.get(resolvedXPath).forEach(control => {
                this.nonRelevantControls.delete(control);
                this.reactivatedControls.add(control);
                this.pendingUpdates.add(control);
            });
        }

        //  Check WeakMap-tracked nodes
        for (let [node, binding] of this.nodeBindings) {
            if (binding.path === resolvedXPath) {
                this.pendingUpdates.add(node);
            }
        }

        if (this.dependencyGraph.hasNode(resolvedXPath)) {
            const dependents = this.dependencyGraph.dependantsOf(resolvedXPath);
            dependents.forEach(dep => this.notifyChange(dep));
        }
    }

    getDeletedIndexes(ref) {
        return this.deletedIndexes.get(ref) || [];
    }

    getInsertedIndexes(ref) {
        return this.insertedIndexes.get(ref) || [];
    }

    // Notify when index() changes and determine affected nodes
    notifyIndexChange(xpath, oldIndex, newIndex) {
        console.log('notifyIndexChange', xpath, newIndex);
        if (this.controlBindings.has(xpath)) {
            for (let control of this.controlBindings.get(xpath)) {
                if (!this.nonRelevantControls.has(control)) {
                    this.pendingUpdates.add(control);
                }
            }
        }
    }

    // Mark a control as non-relevant
    markNonRelevant(control) {
        this.nonRelevantControls.add(control);
        this.pendingUpdates.delete(control);
    }

    // Mark a control as relevant again
    markRelevant(control) {
        if (this.nonRelevantControls.has(control)) {
            this.nonRelevantControls.delete(control);
            this.reactivatedControls.add(control); // Ensure it refreshes in the next cycle
        }
    }

    // Refresh all collected controls in the batch
    processUpdates() {
        console.log('processUpdates pendingUpdates', Array.from(this.pendingUpdates));
        console.log('processUpdates deletedIndexes', Array.from(this.deletedIndexes));
        console.log('processUpdates insertedIndexes', Array.from(this.insertedIndexes));

        let passCount = 0;
        const maxPasses = 10; // guard to prevent infinite loops

        // Keep applying updates as long as new ones appear
        while (this.hasUpdates() && passCount < maxPasses) {
            passCount++;

            // Re-activate any relevant controls
            this.reactivatedControls.forEach(control => this.pendingUpdates.add(control));
            this.reactivatedControls.clear();

            // Filter out non-relevant controls
            const controlsToRefresh = [...this.pendingUpdates].filter(control => !this.nonRelevantControls.has(control));
            this.pendingUpdates.clear();

            this.updateCycle.clear();
            for (let control of controlsToRefresh) {
                if (!this.updateCycle.has(control)) {
                    this.updateCycle.add(control);
                    console.log(`Refreshing control or template expression: ${control}`);

                    // If it's a regular UI control, call refresh()
                    if (typeof control.refresh === 'function') {
                        control.refresh();
                    } else {
                        // Otherwise, it's a template expression, update it
                        const bindingInfo = this.nodeBindings.get(control);
                        if (bindingInfo && bindingInfo instanceof TemplateBinding) {
                            console.log(`Updating template expression for node:`, control);
                            bindingInfo.refresh();
                        }
                    }
                }
            }
        }

        if (passCount >= maxPasses) {
            console.warn('Max pass limit reached — possible infinite update loop!');
        }
        this.deletedIndexes.clear();
        this.insertedIndexes.clear();
    }

    // Check if there are pending updates
    hasUpdates() {
        return this.pendingUpdates.size > 0 || this.reactivatedControls.size > 0;
    }

    extractDependencies(expression) {
        const dependencies = new Set();

        // Match standard XPath variable names: foo, foo/bar, instance('default')/foo
        const regex = /(?:instance\(['"]?([^'"\)]*)['"]?\))?([a-zA-Z_][\w/-]*)/g;
        let match;

        while ((match = regex.exec(expression)) !== null) {
            let fullPath = match[0];  // Entire matched XPath
            dependencies.add(fullPath);
        }

        return dependencies;
    }

    detectTemplateExpressions(root) {
        const templateNodes = root.querySelectorAll('*');

        templateNodes.forEach(node => {
            if (node.childNodes.length) {
                node.childNodes.forEach(child => {
                    if (child.nodeType === Node.TEXT_NODE && /\{([^}]+)\}/.test(child.textContent)) {
                        const matches = child.textContent.match(/\{([^}]+)\}/g);
                        matches.forEach(match => {
                            const expression = match.replace(/\{|\}/g, '').trim();
                            console.log(`Registering template expression: ${expression} for node`, child);
                            this.registerTemplateBinding(expression, child);
                        });
                    }
                });
            }
        });
    }
}
