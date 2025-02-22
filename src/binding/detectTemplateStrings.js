import { DependencyTracker } from '../DependencyTracker';
import ForeElementMixin from '../ForeElementMixin';
import { evaluateXPathToNodes } from '../xpath-evaluation';

/**
 * @param {string} text
 */
function extractBraces(text) {
    const result = [];
    const stack = [];
    let current = '';
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '{') {
            if (stack.length > 0) current += text[i];
            stack.push('{');
        } else if (text[i] === '}') {
            stack.pop();
            if (stack.length === 0) {
                result.push(current);
                current = '';
            } else {
                current += text[i];
            }
        } else if (stack.length > 0) {
            current += text[i];
        }
    }
    return result;
}

/**
 * @param {Node} node
 */
function _getTemplateExpression(node) {
    /* todo: re-activate ignoredNodes
								if (this.ignoredNodes) {
										if (node.nodeType === Node.ATTRIBUTE_NODE) {
												node = node.ownerElement;
										}
										const found = this.ignoredNodes.find(n => n.contains(node));
										if (found) return null;
								}
				*/
    if (node.nodeType === Node.ATTRIBUTE_NODE) {
        return node.value;
    }
    if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent.trim();
    }
    return null;
}

/**
 * @param {ForeElementMixin} root
 */
export function detectTemplateExpressions(root) {
    // Will also be called on the $default scope
    // console.log('🔍 detectTemplateExpressions for', root);
    const tmplExpressions = [];

    /**
     * @type {Node[]}
     */
    const stack = []
        .concat(Array.from(root.childNodes))
        .concat(Array.from(root.attributes));
    while (stack.length) {
        const item = stack.pop();
        switch (item.nodeType) {
            case Node.ELEMENT_NODE:
                const ele = /** @type {Element} */ (item);
                if (ele.nodeName.startsWith('fx-')) {
                    break;
                }
                for (const child of Array.from(ele.childNodes)) {
                    stack.unshift(child);
                }
                for (const child of Array.from(ele.attributes)) {
                    stack.unshift(child);
                }
                break;

            case Node.TEXT_NODE:
                const textNode = /** @type {Text} */ (item);
                if (/\{.*\}/s.test(textNode.data)) {
                    tmplExpressions.push(textNode);
                }
                break;

            case Node.ATTRIBUTE_NODE:
                const attr = /** @type {Attr} */ (item);
                if (/\{.*\}/s.test(attr.value)) {
                    tmplExpressions.push(attr);
                }
        }
    }

    if(tmplExpressions.length === 0) return;
    Array.from(tmplExpressions).forEach((node) => {
        const ele =
            node.nodeType === Node.ATTRIBUTE_NODE
                ? node.ownerElement
                : node.parentNode;
        const expr = extractBraces(_getTemplateExpression(node));
        if (expr.length !== 0) {
            expr.forEach((xpr) => {
                DependencyTracker.getInstance().registerTemplateBinding(
                    xpr,
                    node,
                );
            });
        }
    });
}
