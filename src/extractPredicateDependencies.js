// extract-predicate-deps.js
import { DependencyNotifyingDomFacade } from './DependencyNotifyingDomFacade.js';
import { evaluateXPathToBoolean } from './xpath-evaluation.js';

/**
 * Extracts and registers dependencies from XPath predicates.
 *
 * @param {string} ref - The XPath expression possibly containing predicates.
 * @param {Node} contextNode - The context node for evaluation.
 * @param {(modelItem: import('./modelitem.js').ModelItem) => void} register - A callback to register observers.
 * @param {(node: Node) => import('./modelitem.js').ModelItem} resolveModelItem - A callback to resolve modelItems.
 */
export function extractPredicateDependencies(ref, contextNode, register, resolveModelItem) {
  const predicateRegex = /\[(.*?)\]/g;
  let match;
  const touchedNodes = new Set();

  while ((match = predicateRegex.exec(ref)) !== null) {
    const predicate = match[1];
    try {
      const domFacade = new DependencyNotifyingDomFacade(n => touchedNodes.add(n));
      const fakeContext = { dispatchEvent: () => {} }; // prevent null dispatchEvent crash
      evaluateXPathToBoolean(predicate, contextNode, undefined, domFacade);

      touchedNodes.forEach(node => {
        const mi = resolveModelItem(node);
        if (mi) {
          register(mi);
          console.log(`[PredicateDependency] Observing ${mi.path} from predicate: [${predicate}]`);
        }
      });
    } catch (e) {
      console.warn('Failed to evaluate predicate expression:', predicate, e);
    }
  }
}
