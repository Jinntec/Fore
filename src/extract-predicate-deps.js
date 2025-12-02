// extract-predicate-deps.js
import { DependencyNotifyingDomFacade } from './DependencyNotifyingDomFacade.js';
import { evaluateXPathToBoolean } from './xpath-evaluation.js';

/**
 * Extracts an instance ID from an XPath expression like instance('myInstance')/something
 * @param {string} xpathExpr
 * @returns {string|null} The extracted instance ID or null if not found
 */
function extractInstanceIdFromXPath(xpathExpr) {
  const instanceRegex = /instance\(['"]([^)'"]+)['"]\)/;
  const match = xpathExpr.match(instanceRegex);
  return match ? match[1] : null;
}

/**
 * Gets the context node for a predicate XPath expression.
 * @param {string} predicateExpr
 * @param {import('./fx-model.js').FxModel} model
 * @returns {Node}
 */
function getContextNodeForPredicate(predicateExpr, model) {
  const instanceId = extractInstanceIdFromXPath(predicateExpr) || 'default';
  const instance = model.getInstance(instanceId);
  return instance.getDefaultContext();
}

/**
 * Extracts and registers dependencies from XPath predicates.
 *
 * @param {string} ref - The XPath expression possibly containing predicates.
 * @param {import('./fx-model.js').FxModel} model - The model to resolve instances from.
 * @param {(modelItem: import('./modelitem.js').ModelItem) => void} register - A callback to register observers.
 * @param {(node: Node) => import('./modelitem.js').ModelItem} resolveModelItem - A callback to resolve modelItems.
 */
export function extractPredicateDependencies(ref, contextNode, register, resolveModelItem) {
  const predicateRegex = /\[(.*?)\]/g;
  let match;

  while ((match = predicateRegex.exec(ref)) !== null) {
    const predicate = match[1];
    try {
      const domFacade = new DependencyNotifyingDomFacade(node => {
        const mi = resolveModelItem(node);
        if (mi) {
          register(mi);
          console.log(`[PredicateDependency] Observing ${mi.path} from predicate: [${predicate}]`);
        }
      });

      const predContext = getContextNodeForPredicate(predicate, contextNode);
      evaluateXPathToBoolean(predicate, predContext, { dispatchEvent() {} }, domFacade);
    } catch (e) {
      console.warn('Failed to evaluate predicate expression:', predicate, e);
    }
  }
}
