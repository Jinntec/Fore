import {
    getBucketsForNode
} from 'fontoxpath';

/**
 * A DomFacade that will intercept any and all accesses to _nodes_ from an XPath. Basically the same
 * as the `depends` function, but less explicit and will automatically be called for any node that
 * will be touched in the XPath.
 *
 * Maybe some more granularity is better. Maybe only notify a node's attributes are touched?
 */
export class DependencyNotifyingDomFacade {

    /**
     * @param  {function(touchedNode: Node): void)} onNodeTouched A function what will be executed whenever a node is 'touched' by the XPath
     */
    constructor (onNodeTouched) {
        this._onNodeTouched = onNodeTouched;
    }

    /**
     * Get all attributes of this element.
     * The bucket can be used to narrow down which attributes should be retrieved.
     *
     * @param  node -
     * @param  bucket - The bucket that matches the attribute that will be used.
     */
    getAllAttributes(node, _bucket) {
        return node.getAllAttributes();
    }

    /**
     * Get the value of specified attribute of this element.
     *
     * @param  node -
     * @param  attributeName -
     */
    getAttribute(node, attributeName) {
        return node.getAttribute(attributeName);
    }

    /**
     * Get all child nodes of this element.
     * The bucket can be used to narrow down which child nodes should be retrieved.
     *
     * @param  node -
     * @param  bucket - The bucket that matches the attribute that will be used.
     */
    getChildNodes(node, bucket) {
        const matchingNodes = Array.from(node.childNodes).filter(childNode => getBucketsForNode(childNode).includes(bucket));
        matchingNodes.forEach(matchingNode => this._onNodeTouched(matchingNode));
        return matchingNodes;
    }

    /**
     * Get the data of this element.
     *
     * @param  node -
     */
    getData(node) {
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
        const matchingNode = Array.from(this.getChildNodes()).filter(childNode => getBucketsForNode(node).includes(bucket))[0];
        if (matchingNode) {
            this._onNodeTouched(matchingNode);
            return matchingNode;
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
    getLastChild(node, bucket) {
        const matchingNodes = node.getChildNodes().filter(childNode => getBucketsForNode(node).includes(bucket));
        const matchingNode = matchingNode[matchingNodes.length - 1];
        if (matchingNode) {
            this._onNodeTouched(matchingNode);
            return matchingNode;
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
    getNextSibling(node, bucket) {
        for (let nextSibling = node.nextSibling; nextSibling; nextSibling = nextSibling.nextSibling){
            if (!getBucketsForNode(nextSibling).includes(bucket)) {
                continue;
            }

            this._onNodeTouched(nextSibling);

            return nextSibling;
        }
        return null;
    }

    /**
     * Get the parent of this element.
     * An implementation of IDomFacade is free to interpret the bucket to skip returning nodes that do not match the bucket, or use this information to its advantage.
     *
     * @param  node -
     * @param  bucket - The bucket that matches the attribute that will be used.
     */
    getParentNode(node, bucket) {
        if (node.parentNode) {
            this._onNodeTouched(node.parentNode);
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
    getPreviousSibling(node, bucket) {
        for (let previousSibling = node.previousSibling; previousSibling; previousSibling = previousSibling.previousSibling){
            if (!getBucketsForNode(previousSibling).includes(bucket)) {
                continue;
            }

            this._onNodeTouched(previousSibling);

            return previousSibling;
        }
        return null;
    }
}
