import {DepGraph} from './dep_graph.js';
// import { XPathDependencyExtractor } from './XPathDependencyExtractor.js';

export class DependencyTracker {
    constructor() {
        this.controlBindings = new Map(); // Maps XPath expressions to bound UI controls
        this.dependencyGraph = new DepGraph(); // Directed graph for dependencies
        this.pendingUpdates = new Set(); // Collects controls that need refreshing
        this.nonRelevantControls = new Set(); // Tracks non-relevant controls
        this.reactivatedControls = new Set(); // Tracks controls that became relevant again
        this.updateCycle = new Set(); // Tracks updates per cycle to avoid redundant refreshes
        this.repeatIndexMap = new Map(); // Tracks index() function values for repeated controls
        this.hierarchicalDependencies = new Map(); // Tracks complex XPath dependencies
        // this.xpathExtractor = new XPathDependencyExtractor(); // Extractor for dependencies
    }

    // Register a control binding and auto-detect dependencies
    register(refXPath, control) {
        const resolvedXPath = this.resolveInstanceXPath(refXPath);
        console.log(`Registering XPath: ${refXPath} as ${resolvedXPath}`);

        if (!this.controlBindings.has(resolvedXPath)) {
            this.controlBindings.set(resolvedXPath, new Set());
        }
        this.controlBindings.get(resolvedXPath).add(control);

        // Automatically detect and register dependencies
        // const dependencies = this.xpathExtractor.extractDependencies(refXPath);
        // dependencies.forEach(dep => this.registerDependency(dep, resolvedXPath));
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
        const resolvedXPath = this.resolveInstanceXPath(xpath);
        const oldIndex = this.repeatIndexMap.get(resolvedXPath);
        if (oldIndex !== newIndex) {
            this.repeatIndexMap.set(resolvedXPath, newIndex);
            this.notifyIndexChange(resolvedXPath, oldIndex, newIndex);
        }
    }

    // Notify changes and propagate through the dependency graph
    notifyChange(changedXPath) {
        console.log('notifyChange',changedXPath);
        const resolvedXPath = this.resolveInstanceXPath(changedXPath);
        const affectedXPaths = new Set([resolvedXPath]);

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

        for (let affectedXPath of affectedXPaths) {
            if (this.controlBindings.has(affectedXPath)) {
                for (let control of this.controlBindings.get(affectedXPath)) {
                    if (!this.nonRelevantControls.has(control)) {
                        this.pendingUpdates.add(control);
                    }
                }
            }
        }
    }

    // Notify when index() changes and determine affected nodes
    notifyIndexChange(xpath, oldIndex, newIndex) {
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
        console.log('processUpdates', Array.from(this.pendingUpdates));
        console.log('processUpdates', this);
        // Ensure reactivated controls are refreshed
        this.reactivatedControls.forEach(control => this.pendingUpdates.add(control));
        this.reactivatedControls.clear();

        const controlsToRefresh = [...this.pendingUpdates].filter(control => !this.nonRelevantControls.has(control));
        this.pendingUpdates.clear(); // Clear before refreshing to prevent double refresh in same cycle

        this.updateCycle.clear(); // Track this cycle's updates
        for (let control of controlsToRefresh) {
            if (!this.updateCycle.has(control)) { // Prevent multiple refreshes
                this.updateCycle.add(control);
                console.log(`Refreshing control: ${control.ref}`);
                control.refresh(); // Assume UI control has a refresh method
            }
        }
    }

    // Check if there are pending updates
    hasUpdates() {
        return this.pendingUpdates.size > 0 || this.reactivatedControls.size > 0;
    }
}
