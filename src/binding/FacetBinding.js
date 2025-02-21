// FacetBinding.js
import { DependencyTracker } from '../DependencyTracker';
import { DependencyNotifyingDomFacade } from '../DependencyNotifyingDomFacade';
import { XPathUtil } from '../xpath-util';
import {
    evaluateXPath,
    evaluateXPathToBoolean,
    evaluateXPathToString,
} from '../xpath-evaluation';
import getInScopeContext from '../getInScopeContext';
import { Binding } from './Binding.js';

/**
 * represents a single facet of a NodeBinding.
 *
 * Gets ModelItem passed from it's parent NodeBinding and updates the state of the respective facet during compute.
 */
export class FacetBinding extends Binding {
    /**
     * Constructs a FacetBinding.
     * @param {object} node - The node this FacetBinding belongs to
     * @param {string} facetName - The facet type (e.g. 'calculate', 'readonly', etc.).
     * @param {string} expression - The XPath facet expression.
     */
    constructor(modelItem, facetName) {
        // Create a composite key for the facet binding.
        super(`${modelItem.path}:${facetName}`, 'facet');
        this.modelItem = modelItem;
        this.node = modelItem.node;
        this.facetName = facetName;

        this.expression = modelItem.bind[facetName];
        // console.log('Facet', this.expression)

        // Register this binding with the unified dependency graph.
        // DependencyTracker.getInstance().registerBinding(this.xpath, this);
    }

    /**
     * Re-evaluate the facet expression and update the control.
     */
    update() {
        super.update();
        this.compute();
        /*
                console.log(`FacetBinding.refresh() for key ${this.key}: evaluating "${this.expression}"`);
                const inscope = getInScopeContext(this.control, this.expression);
                if (!inscope) {
                    console.warn(`FacetBinding (${this.key}): no in-scope context`);
                    return;
                }
                let computedValue;
                try {
                    computedValue = evaluateXPathToBoolean(this.expression, inscope, this.control);
                } catch (error) {
                    console.warn(`FacetBinding (${this.key}): error evaluating expression:`, error);
                    return;
                }
                // Update the control using a dedicated method if available.
                if (typeof this.control.setFacet === "function") {
                    this.control.setFacet(this.facetName, computedValue);
                } else {
                    this.control[this.facetName] = computedValue;
                }
                console.log(`FacetBinding (${this.key}): set facet '${this.facetName}' to ${computedValue}`);
        */
    }

    compute() {
        const { modelItem } = this;
        const { facetName } = this;
        const expr = modelItem.bind[facetName];
        const fore = modelItem.bind.getOwnerForm();

        if (facetName === 'calculate') {
            const compute = evaluateXPath(expr, modelItem.node, fore);
            modelItem.value = compute;
            modelItem.readonly = true; // calculated nodes are always readonly
        } else if (facetName !== 'constraint' && facetName !== 'type') {
            // ### re-compute the Boolean value of all facets expect 'constraint' and 'type' which are handled in revalidate()
            if (this.expression) {
                const compute = evaluateXPathToBoolean(
                    expr,
                    modelItem.node,
                    fore,
                );
                modelItem[facetName] = compute;
                console.log(
                    `recalculating path ${this.xpath} - Expr:'${this.expression}' computed`,
                    modelItem[facetName],
                );
            }
        }
        // update computes
        fore.getModel().computes += 1;
    }
}
