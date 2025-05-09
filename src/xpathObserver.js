/**
 * @typedef {{
 *        getResult(): T;
 *        addObserver(observer: () => void): () => void
 *     }} ObservableResult<T>
 * @template {Node[] | string} T
 *
 * An observable XPath result. Can be used like this:
 *
 * @example
 * ```js
 * // In connectedCallback
 * const ref = this.ref; // "//p"
 * const refObserver = observeXPath(ref, () => inscopeContext, formElement, ReturnTypes.NODES)
 * this.refObserver = refObserver;
 * this.refObserver.addObserver(() => {dependencyTracker.markAsDirty(this)})
 *
 * // In refresh:
 * const newResults = this.refObserver.getResults()
 * ```
 */

import { ReturnType } from 'fontoxpath';
import ForeElementMixin from './ForeElementMixin';
import { evaluateXPath } from './xpath-evaluation';
import { DependencyNotifyingDomFacade } from './DependencyNotifyingDomFacade';

/**
 * @type {Map<Document, MutationObserver>}
 */
const mutationObserverByDocument = new Map();

/**
 * @type {Map<() => Node, Observer>}
 */
const getContextNodeByObserver = new Map();

/**
 * @typedef {{processInvalidation(): void, previousContextNode: Node}} Observer
 */

/**
 * @type {Map<MutationRecordType, Map<Node, Set<Observer>>>}
 */
const interestedObserverByMutationRecordType = new Map()
    .set('characterData', new Map())
    .set('childList', new Map())
    .set('attributes', new Map());

/**
 * @param {MutationRecord[]} records
 */
const processDependencies = (records) => {
    const invalidatedObservers = new Set();
    for (const record of records) {
        const depsForType = interestedObserverByMutationRecordType.get(
            record.type,
        );
        if (depsForType.has(record.target)) {
            invalidatedObservers.add(depsForType.get(record.target));
        }
    }

    for (const [getContextItem, observer] of getContextNodeByObserver) {
        if (getContextItem() !== observer.previousContextNode) {
        }
    }

    for (const invalidatedObserver of invalidatedObservers) {
        invalidatedObserver.processInvalidation();
    }
};

/**
 * @type {Map<string, Set<Observer>>}
 */
const interestedObserversByRepeatId = new Map();

/**
 * @param {string} repeatId - The id of the repeat
 */
export function signalIndexUpdate(repeatId) {
    const interestedObservers = interestedObserversByRepeatId.get(repeatId);
    if (!interestedObservers) {
        return;
    }
    for (const interestedObserver of interestedObservers) {
        interestedObserver.processInvalidation();
    }
}

/**
 * @param {string} xpath - The XPath to run
 * @param {ForeElementMixin} formElement - The form element related to the XPath. Used for variable resolving
 *  @param {() => Node}  getContextNode - The context item to the XPath

 * @param {ReturnType.NODES | ReturnType.STRING} expectedReturnType - The expected return type of the XPath
 * @template {Node[] | string} T
 * @returns {ObservableResult<T>}
 */
export default function observeXPath(
    xpath,
    getContextNode,
    formElement,
    expectedReturnType,
) {
    const listeners = new Set();
    /**
     * @type {Map<Node, Set<MutationRecordType>>}
     */
    const nodeDependencies = new Map();
    const repeatIndexDependencies = new Set();
    const dependencyTracker = new DependencyNotifyingDomFacade(
        (node, dependencyType) => {
            if (nodeDependencies.has(node)) {
                nodeDependencies.get(node).add(dependencyType);
            }
            nodeDependencies.set(node, new Set().add(dependencyType));
            if (mutationObserverByDocument.has(node.ownerDocument)) {
                return;
            }
            const mutObserver = new MutationObserver(processDependencies);
            mutationObserverByDocument.set(node.ownerDocument, mutObserver);
        },
        (dependencyType) => {
            switch (dependencyType.dependencyKind) {
                case 'repeat-index':
                    repeatIndexDependencies.add(dependencyType.repeat);
                    break;
                default:
                    throw new Error(
                        `Unknown dependency kind: ${dependencyType.dependencyKind}`,
                    );
            }
        },
        true,
    );

    const observer = {
        processInvalidation: () => {
            for (const listener of listeners) {
                listener();
            }
        },
        previousContextNode: null,
    };

    getContextNodeByObserver.set(getContextNode, observer);
    let oldResult = null;
    return {
        addObserver: (callback) => {
            listeners.add(callback);
            return () => {
                listeners.delete(callback);
            };
        },
        get __oldresult__() {
            return oldResult;
        },
        getResult: () => {
            // Clean up old dependencies
            for (const [node, types] of nodeDependencies) {
                for (const dependencyType of types) {
                    let observers = interestedObserverByMutationRecordType
                        .get(dependencyType)
                        .get(node);
                    observers.delete(observer);
                }
            }
            for (const repeatIndexDependency of repeatIndexDependencies) {
                interestedObserversByRepeatId
                    .get(repeatIndexDependency)
                    .delete(observer);
            }
            nodeDependencies.clear();
            repeatIndexDependencies.clear();

            observer.previousContextNode = getContextNode();
            const newResult = evaluateXPath(
                xpath,
                observer.previousContextNode,
                formElement,
                {},
                {},
                dependencyTracker,
            );

            oldResult = newResult;

            for (const [node, types] of nodeDependencies) {
                for (const dependencyType of types) {
                    let observers = interestedObserverByMutationRecordType
                        .get(dependencyType)
                        .get(node);
                    if (!observers) {
                        observers = new Set();
                        interestedObserverByMutationRecordType
                            .get(dependencyType)
                            .set(node, observers);
                    }
                    observers.add(observer);
                }
            }
            for (const repeatIndexDependency of repeatIndexDependencies) {
                let otherObservers = interestedObserversByRepeatId.get(
                    repeatIndexDependency,
                );
                if (!otherObservers) {
                    otherObservers = new Set();
                    interestedObserversByRepeatId.set(
                        repeatIndexDependency,
                        otherObservers,
                    );
                }
                otherObservers.add(observer);
            }

            return /** @type {T} */ (/** {any} */ newResult);
        },
    };
}
