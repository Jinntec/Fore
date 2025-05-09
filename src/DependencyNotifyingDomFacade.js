import { getBucketsForNode } from 'fontoxpath';

/**
 * A DomFacade that will intercept any and all accesses to _nodes_ from an XPath. Basically the same
 * as the `depends` function, but less explicit and will automatically be called for any node that
 * will be touched in the XPath.
 *
 * Maybe some more granularity is better. Maybe only notify a node's attributes are touched?
 *
 */
export class DependencyNotifyingDomFacade {
    /**
     * @param  {(node: Node, type?: MutationRecordType) => void} onNodeTouched - onNodeTouched A function what will be executed whenever a node is 'touched' by the XPath
     * @param  {(dep: {dependencyKind: 'repeat-index', repeat: string})=> void} onOtherDependency - A callback that will be fired if the index function is called
     */
    constructor(onNodeTouched, onOtherDependency, mutationRecordMode = false) {
        this._onNodeTouched = onNodeTouched;
        this.onOtherDependency = onOtherDependency;

        this.mutationRecordMode = mutationRecordMode;
    }

    /**
     * Get all attributes of this element.
     * The bucket can be used to narrow down which attributes should be retrieved.
     *
     * @param  node -
     */
    // eslint-disable-next-line class-methods-use-this
    getAllAttributes(node) {
        return Array.from(node.attributes);
    }

    /**
     * Get the value of specified attribute of this element.
     *
     * @param  node -
     * @param  attributeName -
     */
    // eslint-disable-next-line class-methods-use-this
    getAttribute(node, attributeName) {
        if (this.mutationRecordMode) {
            this._onNodeTouched(node, 'attributes');
        }
        return node.getAttribute(attributeName);
    }

    /**
     * Get all child nodes of this element.
     * The bucket can be used to narrow down which child nodes should be retrieved.
     *
     * @param  node -
     * @param  bucket - The bucket that matches the attribute that will be used.
     */
    // eslint-disable-next-line class-methods-use-this
    getChildNodes(node, bucket) {
        const matchingNodes = Array.from(node.childNodes).filter(
            (childNode) =>
                !bucket || getBucketsForNode(childNode).includes(bucket),
        );
        if (this.mutationRecordMode) {
            this._onNodeTouched(node, 'childList');
        } else {
            matchingNodes.forEach((matchingNode) =>
                this._onNodeTouched(matchingNode),
            );
        }
        return matchingNodes;
    }

    /**
     * Get the data of this node.
     *
     * @param  node -
     */
    getData(node) {
        if (node.nodeType === Node.ATTRIBUTE_NODE) {
            this._onNodeTouched(node, 'attributes');
            return node.value;
        }
        // Text node
        if (this.mutationRecordMode) {
            this._onNodeTouched(node, 'characterData');
        } else {
            this._onNodeTouched(node.parentNode);
        }
        return node.data;
    }

    /**
     * Get the first child of this element.
     * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
     *
     * @param  node -
     * @param  bucket - The bucket that matches the attribute that will be used.
     */
    getFirstChild(node, bucket) {
        if (this.mutationRecordMode) {
            this._onNodeTouched(node, 'childList');
        }
        for (const child of node.childNodes) {
            if (!bucket || getBucketsForNode(child).includes(bucket)) {
                if (!this.mutationRecordMode) {
                    this._onNodeTouched(child);
                }
                return child;
            }
        }
        return null;
    }

    /**
     * Get the last child of this element.
     * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
     *
     * @param  node -
     * @param  bucket - The bucket that matches the attribute that will be used.
     */
    // eslint-disable-next-line class-methods-use-this
    getLastChild(node, bucket) {
        if (this.mutationRecordMode) {
            this._onNodeTouched(node, 'childList');
        }
        const matchingNodes = node
            .getChildNodes()
            .filter(
                (childNode) =>
                    !bucket || getBucketsForNode(childNode).includes(bucket),
            );
        const matchNode = matchingNodes[matchingNodes.length - 1];
        if (matchNode) {
            return matchNode;
        }
        return null;
    }

    /**
     * Get the next sibling of this node
     * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
     *
     * @param  node -
     * @param  bucket - The bucket that matches the nextSibling that is requested.
     */
    // eslint-disable-next-line class-methods-use-this
    getNextSibling(node, bucket) {
        if (this.mutationRecordMode) {
            this._onNodeTouched(node.parentNode, 'childList');
        }
        for (
            let sibling = node.nextSibling;
            sibling;
            sibling = sibling.nextSibling
        ) {
            if (bucket && !getBucketsForNode(sibling).includes(bucket)) {
                // eslint-disable-next-line no-continue
                continue;
            }
            if (!this.mutationRecordMode) {
                this._onNodeTouched(sibling);
            }
            return sibling;
        }
        return null;
    }

    /**
     * Get the parent of this element.
     * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
     *
     * @param  node - the starting node
     */
    // eslint-disable-next-line class-methods-use-this
    getParentNode(node) {
        if (this.mutationRecordMode) {
            this._onNodeTouched(node.parentNode, 'childList');
        }

        return node.parentNode;
    }

    /**
     * Get the previous sibling of this element.
     * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
     *
     * @param  node -
     * @param  bucket - The bucket that matches the attribute that will be used.
     */
    // eslint-disable-next-line class-methods-use-this
    getPreviousSibling(node, bucket) {
        if (this.mutationRecordMode) {
            this._onNodeTouched(node.parentNode, 'childList');
        }
        for (
            let { previousSibling } = node;
            previousSibling;
            previousSibling = previousSibling.previousSibling
        ) {
            if (
                bucket &&
                !getBucketsForNode(previousSibling).includes(bucket)
            ) {
                // eslint-disable-next-line no-continue
                continue;
            }

            return previousSibling;
        }
        return null;
    }
}
