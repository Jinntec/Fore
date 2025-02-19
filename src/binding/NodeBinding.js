// NodeBinding.js
import { DependencyTracker } from '../DependencyTracker';
import { FacetBinding } from './FacetBinding';
import { XPathUtil } from '../xpath-util';
import { DependencyNotifyingDomFacade } from '../DependencyNotifyingDomFacade';
import { evaluateXPathToString } from '../xpath-evaluation';
import { Binding } from './Binding.js';
import { ModelItem } from '../modelitem';

export class NodeBinding extends Binding {
    /**
     *
     * A NodeBinding represents the association of an XPath with a Node in the data.
     *
     * @param {ModelItem} ModelItem state object wrapping data node
     */
    constructor(modelItem, fore) {
        super(modelItem.path, 'node');
        this.modelItem = modelItem;
        this.node = modelItem.node;
        this.calculate = modelItem.bind.calculate;
        this.readonly = modelItem.bind.readonly;
        this.required = modelItem.bind.required;
        this.relevant = modelItem.bind.relevant;
        this.constraint = modelItem.bind.constraint;
        this.mainGraph = DependencyTracker.getInstance().dependencyGraph;
        this.fore = fore;

        // Register the base NodeBinding with the DependencyTracker.
        DependencyTracker.getInstance().registerBinding(this.xpath, this);

        // todo registerDependencies from ref predicates
        this._registerDependencies();

        // Now let this NodeBinding register all its facet dependencies.
        this.registerFacets();
    }

    update() {
        super.update();
    }

    registerFacets() {
        // Process "calculate" facet first.
        if (this.calculate) {
            // Create the FacetBinding for 'calculate' (even if later it may be made readonly).
            // new FacetBinding(this.node, 'calculate', this.calculate, this.path);
            const calcFacet = new FacetBinding(this.modelItem, 'calculate');
            // register this facet
            DependencyTracker.getInstance().registerBinding(
                `${this.xpath}:calculate`,
                calcFacet,
            );

            // Register the dependency from the NodeBinding to the calculate facet.
            // DependencyTracker.getInstance().registerDependency(`${this.xpath}:calculate`, this.xpath);

            // Optionally, extract and process additional references.
            const calcRefs = this.getReferencesForProperty(this.calculate);
            this._addFacetDependencies(calcRefs, 'calculate');
        }

        // Process readonly facet only if there is no calculate (calculated values are readonly).
        if (!this.calculate && this.readonly) {
            const readonlyFacet = new FacetBinding(this.modelItem, 'readonly');
            // register this facet
            DependencyTracker.getInstance().registerBinding(
                `${this.xpath}:readonly`,
                readonlyFacet,
            );

            // Register the dependency from the NodeBinding to the calculate facet.
            //  DependencyTracker.getInstance().registerDependency(`${this.xpath}:readonly`, this.xpath);

            const readonlyRefs = this.getReferencesForProperty(this.readonly);
            this._addFacetDependencies(readonlyRefs, 'readonly');
        }

        // Process required facet.
        if (this.required) {
            const requiredFacet = new FacetBinding(this.modelItem, 'required');
            // register this facet
            DependencyTracker.getInstance().registerBinding(
                `${this.xpath}:required`,
                requiredFacet,
            );

            // Register the dependency from the NodeBinding to the calculate facet.
            //    DependencyTracker.getInstance().registerDependency(`${this.xpath}:required`, this.xpath);

            const requiredRefs = this.getReferencesForProperty(this.required);
            this._addFacetDependencies(requiredRefs, 'required');
        }

        // Process relevant facet.
        if (this.relevant) {
            const relevantFacet = new FacetBinding(this.modelItem, 'relevant');
            // Register the dependency from the NodeBinding to the calculate facet.
            //      DependencyTracker.getInstance().registerDependency(`${this.xpath}:relevant`, this.xpath);
            // register this facet
            DependencyTracker.getInstance().registerBinding(
                `${this.xpath}:relevant`,
                relevantFacet,
            );

            const relevantRefs = this.getReferencesForProperty(this.relevant);
            this._addFacetDependencies(relevantRefs, 'relevant');
        }

        // Process constraint facet.
        if (this.constraint) {
            const constraintFacet = new FacetBinding(
                this.modelItem,
                'constraint',
            );
            // register this facet
            DependencyTracker.getInstance().registerBinding(
                `${this.xpath}:constraint`,
                constraintFacet,
            );

            // Register the dependency from the NodeBinding to the calculate facet.
            DependencyTracker.getInstance().registerDependency(
                `${this.xpath}:constraint`,
                this.xpath,
            );

            const constraintRefs = this.getReferencesForProperty(
                this.constraint,
            );
            this._addFacetDependencies(constraintRefs, 'constraint');
        }
    }

    /**
     * Helper method to add dependencies for a given facet.
     *
     * @param {Node[]} refs - The nodes referenced by the facet expression.
     * @param {string} facetName - e.g. 'calculate', 'readonly', etc.
     */
    _addFacetDependencies(refs, facetName) {
        const facetKey = `${this.xpath}:${facetName}`;
        refs.forEach((ref) => {
            // Resolve the reference into a canonical path.
            const instance = XPathUtil.resolveInstance(
                {
                    /* context if needed */
                },
                this.xpath,
            );
            const refPath = XPathUtil.getPath(ref, instance);
            // Skip duplicates, e.g. text()[1] if needed.
            if (!refPath.endsWith('text()[1]')) {
                if (!this.mainGraph.hasNode(refPath)) {
                    this.mainGraph.addNode(refPath, ref);
                }
                // Register the dependency: the facet depends on this reference.
                this.mainGraph.addDependency(facetKey, refPath);
            }
        });
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
    getReferencesForProperty(propertyExpr) {
        if (propertyExpr) {
            return this.getReferences(propertyExpr);
        }
        return [];
    }

    getReferences(propertyExpr) {
        const touchedNodes = new Set();
        const domFacade = new DependencyNotifyingDomFacade((otherNode) =>
            touchedNodes.add(otherNode),
        );
        // this.node.forEach((node) => {
        evaluateXPathToString(propertyExpr, this.node, this.fore, domFacade);
        // });
        return Array.from(touchedNodes.values());
    }

    _registerDependencies() {
        // todo: examine predicates and register deps
    }
}
