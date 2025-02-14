import getInScopeContext from "../getInScopeContext.js";
import {XPathUtil} from "../xpath-util.js";
import {evaluateXPathToString} from "../xpath-evaluation.js";
import {Binding} from "./Binding.js";

/**
 * Handles template-bound expressions (e.g., {value} in text nodes or attributes)
 */
export class TemplateBinding extends Binding{
    constructor(expression, node) {
        // For template bindings, we can use a key based on the node and expression.
        // For example, if the node belongs to a container with a canonical XPath.
        const container = node.nodeType === Node.ATTRIBUTE_NODE ? node.ownerElement : node.parentNode;
        // Assume we have a function to get the container's canonical XPath.
        const containerPath = container ? XPathUtil.getCanonicalXPath(container) : "$default";
        const compositeKey = `${containerPath}:template:${expression}`;
        super(compositeKey, "template");

        this.node = node;
        this.expression = expression;
        // Store the original template so that refresh always starts from the unmodified text.
        this.template = node.nodeType === Node.ATTRIBUTE_NODE ? node.value : node.textContent;

        // DependencyTracker.getInstance().registerBinding(this.key, this);
        // console.log(`TemplateBinding created for key ${this.key} with expression: ${this.expression}`);
        this.update();
    }
    update() {
        console.log('TemplateBinding refresh', this);
        const ownerElement = this.node.parentNode ? this.node.parentNode : this.node.ownerElement;
        if(!ownerElement.closest('fx-fore').inited) return;

        console.log(`Refreshing template expression: ${this.expression} for`, this.node);

        /*
                // Evaluate expression and get result
                this.evaluateTemplateExpression(this.expression, this.node);

                if (!newValue) {
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
        */
    }

    /**
     * evaluate a template expression on a node either text- or attribute node.
     * @param {string} expr The string to parse for expressions
     * @param {Node} node the node which will get updated with evaluation result
     */
/*
    evaluateTemplateExpression(expr, node) {
        const ownerElement = node.parentNode ? node.parentNode : node.ownerElement;
        if (!ownerElement) {
            console.warn(`No parent/owner for template expression: ${expr}`, node);
            return null;
        }
        // Ignore processing if inside a [nonrelevant] section
        if (ownerElement.closest('[nonrelevant]')) return null;

    // Use the stored original template instead of node.textContent or node.value
    const templateText = this.template;
    const replaced = templateText.replace(/{[^}]*}/g, match => {
            if (match === '{}') return match;
            const naked = match.substring(1, match.length - 1);
            const inscope = getInScopeContext(node, naked);
            if (!inscope) {
                console.warn('no inscope context for expr', naked);
                return match;
            }
        // Templates are special: they use the namespace configuration from where they are defined
            const instanceId = XPathUtil.getInstanceId(naked);
            const inst = instanceId
            ? ownerElement.closest('fx-fore').getModel().getInstance(instanceId)
            : ownerElement.closest('fx-fore').getModel().getDefaultInstance();
            try {
                return evaluateXPathToString(naked, inscope, node, null, inst);
            } catch (error) {
                console.warn('ignoring unparseable expr', error);
                return match;
            }
        });

    // Update the node only if its content has changed.
        if (node.nodeType === Node.ATTRIBUTE_NODE) {
            const parent = node.ownerElement;
            if (parent.getAttribute(node.nodeName) !== replaced) {
                parent.setAttribute(node.nodeName, replaced);
            }
        } else if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent !== replaced) {
                node.textContent = replaced;
            }
        }

    return replaced;
    }
*/

    /**
     * Retrieves the nearest `<fx-fore>` element's model.
     * @param {Node} node The node to start searching from.
     * @returns {Object} The model instance from `fx-fore`.
     */
/*
    getModel(node) {
        const ownerElement = node.parentNode ? node.parentNode : node.ownerElement;
        const fxFore = ownerElement.closest('fx-fore');

        if (!fxFore) {
            console.warn(`No <fx-fore> found for`, node);
            return null;
        }

        return fxFore.getModel();
    }
*/
}
