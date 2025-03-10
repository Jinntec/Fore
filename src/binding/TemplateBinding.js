import getInScopeContext from '../getInScopeContext.js';
import { XPathUtil } from '../xpath-util.js';
import {evaluateXPath, evaluateXPathToString} from '../xpath-evaluation.js';
import { Binding } from './Binding.js';

/**
 * Handles template-bound expressions (e.g., {value} in text nodes or attributes)
 */
export class TemplateBinding extends Binding {
    constructor(expression, node) {
        const container =
            node.nodeType === Node.ATTRIBUTE_NODE
                ? node.ownerElement
                : node.parentNode;
        // Assume we have a function to get the container's canonical XPath.
        const containerPath = container
            ? XPathUtil.getCanonicalXPath(container)
            : '$default';
        // const compositeKey = `${containerPath}:template:${expression}`;

        const fore = container.closest('fx-fore');
        const inscope = getInScopeContext(node, expression);
        const targetNode = evaluateXPath(expression, inscope, node, fore);
        // try to get path() for targetNode - may fail in case of function calls or non-node returns
        try{
            const path = XPathUtil.getCanonicalXPath(targetNode);
            super(`${path}:template`, 'template');
        }catch (e){
            super('unbound:template', 'template');
            // super(`${containerPath}`, 'template');
        }
        this.fore = fore;
        this.node = node;
        this.expression = expression;
        // this.scope = scope;
        // Store the original template so that refresh always starts from the unmodified text.
        this.template =
            node.nodeType === Node.ATTRIBUTE_NODE
                ? node.value
                : node.textContent;

        // console.log(`TemplateBinding created for key ${this.key} with expression: ${this.expression}`);
    }

    update() {

        super.update();
        // console.log('🔄 TemplateBinding update', this);
        const ownerElement = this.node.parentNode
            ? this.node.parentNode
            : this.node.ownerElement;
        const fore = ownerElement.closest('fx-fore');
        if (!fore.inited) return;

        // skipping ignored elements
        if(this._isIgnored(ownerElement)) return;

/*
        console.log(
            `Refreshing template expression: {${this.expression}} for`,
            this.node,
        );
*/

        // Evaluate expression and get result
        const replaced = this.evaluateTemplateExpression(
            this.expression,
            this.node,
        ).trim();

        // Update the node only if its content has changed.
        if (this.node.nodeType === Node.ATTRIBUTE_NODE) {
            const parent = this.node.ownerElement;
            if (parent.getAttribute(this.node.nodeName) !== replaced) {
                parent.setAttribute(this.node.nodeName, replaced);
            }
        } else if (this.node.nodeType === Node.TEXT_NODE) {
            if (this.node.textContent !== replaced) {
                this.node.textContent = replaced;
            }
        }
    }

    /**
     * evaluate a template expression on a node either text- or attribute node.
     * @param {string} expr The string to parse for expressions
     * @param {Node} node the node which will get updated with evaluation result
     */
    evaluateTemplateExpression(expr, node) {
        const ownerElement = node.parentNode
            ? node.parentNode
            : node.ownerElement;
        if (!ownerElement) {
            console.warn(
                `No parent/owner for template expression: ${expr}`,
                node,
            );
            return null;
        }
        // Ignore processing if inside a [nonrelevant] section
        if (ownerElement.closest('[nonrelevant]')) return null;

        // Use the stored original template instead of node.textContent or node.value
        const templateText = this.template;
        const replaced = templateText.replace(/{[^}]*}/g, (match) => {
            if (match === '{}') return match;
            const naked = match.substring(1, match.length - 1);

            /*
                template expressions are scoped to their respective container or fallback to containing fx-fore
                element and the default context.
             */
            // let inscope = this.scope.nodeset;
            let inscope = getInScopeContext(this.node,naked);
            if (!inscope) {
                const fore = this.node.closest('fx-fore');
                inscope = fore.getModel().getDefaultContext();
            }
            if (!inscope) {
                console.warn('no inscope context for expr', naked);
                return match;
            }
            // Templates are special: they use the namespace configuration from where they are defined
            const instanceId = XPathUtil.getInstanceId(naked);
            const inst = instanceId
                ? ownerElement.closest('fx-fore')
                      .getModel()
                      .getInstance(instanceId)
                : ownerElement.closest('fx-fore')
                      .getModel()
                      .getDefaultInstance();
            try {
                return evaluateXPathToString(naked, inscope, node, null, inst);
            } catch (error) {
                console.warn('ignoring unparseable expr', error);
                return match;
            }
        });
        return replaced;
    }

    _isIgnored(element){
        if (this.fore?.ignoredNodes) {
            const found = this.fore.ignoredNodes.find(n => n.contains(element));
            if (found) return true;
        }
        return false
    }

}
