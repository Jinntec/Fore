import getInScopeContext from "../getInScopeContext";
import {XPathUtil} from "../xpath-util";
import {evaluateXPathToString} from "../xpath-evaluation";

/**
 * Handles template-bound expressions (e.g., {value} in text nodes or attributes)
 */
export class TemplateBinding {
    constructor(expression, node) {
        this.expression = expression; // The original XPath expression
        this.node = node; // The DOM node to update

        this.refresh(); // Evaluate immediately upon creation
    }

    refresh() {
        console.log(`Refreshing template expression: ${this.expression} for`, this.node);

        // Evaluate expression and get result
        const newValue = this.evaluateTemplateExpression(this.expression, this.node);

        if (newValue === null) {
            console.warn(`Template expression returned null: ${this.expression}`);
            return;
        }

        if (this.node.nodeType === Node.ATTRIBUTE_NODE) {
            if (this.node.value !== newValue) {
                this.node.value = newValue;
            }
        } else if (this.node.nodeType === Node.TEXT_NODE) {
            if (this.node.textContent !== newValue) {
                this.node.textContent = newValue;
            }
        }
    }

    /**
     * Evaluates a template expression on a node.
     * @param {string} expr - The string to parse for expressions
     * @param {Node} node - The node that will be updated
     * @returns {string|null} The evaluated result, or null if evaluation fails
     */
    evaluateTemplateExpression(expr, node) {
        const ownerElement = node.parentNode ? node.parentNode : node.ownerElement;
        if (!ownerElement) {
            console.warn(`No parent/owner for template expression: ${expr}`, node);
            return null;
        }

        // Ignore processing if inside a [nonrelevant] section
        if (ownerElement.closest('[nonrelevant]')) return null;

        // Find in-scope context
        const inscope = getInScopeContext(node, expr);
        if (!inscope) {
            console.warn(`No in-scope context for expression: ${expr}`);
            return expr; // Return as-is (avoiding breaking UI)
        }

        // Determine instance to use
        const instanceId = XPathUtil.getInstanceId(expr);
        const model = this.getModel(node);
        const inst = instanceId ? model.getInstance(instanceId) : model.getDefaultInstance();

        try {
            return evaluateXPathToString(expr, inscope, node, null, inst);
        } catch (error) {
            console.error(`Error evaluating XPath: ${naked}`, error);
            return expr; // Return as-is to avoid breaking
        }
    }

    /**
     * Retrieves the nearest `<fx-fore>` element's model.
     * @param {Node} node The node to start searching from.
     * @returns {Object} The model instance from `fx-fore`.
     */
    getModel(node) {
        const ownerElement = node.parentNode ? node.parentNode : node.ownerElement;
        const fxFore = ownerElement.closest('fx-fore');

        if (!fxFore) {
            console.warn(`No <fx-fore> found for`, node);
            return null;
        }

        return fxFore.getModel();
    }
}
