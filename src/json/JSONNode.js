// json-node.js

export class JSONNode {
  constructor(value, parent = null, keyOrIndex = null, instanceId = 'default') {
    this.value = value;
    this.parent = parent;
    this.keyOrIndex = keyOrIndex;
    this.instanceId = instanceId;
    this.__jsonlens__ = true;

    if (Array.isArray(value)) {
      this.children = value.map((child, index) => new JSONNode(child, this, index, instanceId));
    } else if (typeof value === 'object' && value !== null) {
      this.children = Object.entries(value).map(
        ([key, val]) => new JSONNode(val, this, key, instanceId),
      );
    } else {
      this.children = [];
    }
  }

  /**
   * Get the value of this node or a child node by key.
   * @param {string|number} [key] - Optional key or index to get a child node
   * @returns {*|JSONNode|undefined} The raw value of this node or a child node
   */
  get(key) {
    // If no key is provided, return the raw value of this node
    if (arguments.length === 0) {
      return this.value;
    }

    // Otherwise, get child node by key or index
    if (Array.isArray(this.value) && typeof key === 'number') {
      return this.children[key];
    }
    if (typeof this.value === 'object' && this.value !== null) {
      return this.children.find(c => c.keyOrIndex === key);
    }
    return undefined;
  }

  /**
   * Get the XPath-style path to this node including instance prefix.
   * @returns {string|null}
   */
  getPath() {
    // Detached: no parent and no key
    const isDetached = this.parent === null && this.keyOrIndex === null;

    // Special case: this is NOT the original root (value-only root has no children)
    if (isDetached && this.children?.length === 0) {
      return null;
    }

    const segments = [];
    let node = this;

    while (node.parent !== null) {
      const key = node.keyOrIndex;

      if (key === null || key === undefined) return null;

      if (typeof key === 'number') {
        segments.unshift(`[${key + 1}]`);
      } else if (/^[a-zA-Z_][\w\-]*$/.test(key)) {
        segments.unshift(`/${key}`);
      } else {
        const escaped = String(key).replace(/'/g, `''`);
        segments.unshift(`/'${escaped}'`);
      }

      node = node.parent;
    }

    return `$${this.instanceId}${segments.join('')}`;
  }

  /**
   * Set the raw value of this node.
   * @param {*} value
   */
  set(value) {
    this.value = value;
    this.children = [];
    if (Array.isArray(value)) {
      this.children = value.map(
        (child, index) => new JSONNode(child, this, index, this.instanceId),
      );
    } else if (typeof value === 'object' && value !== null) {
      this.children = Object.entries(value).map(
        ([key, val]) => new JSONNode(val, this, key, this.instanceId),
      );
    }
  }

  /**
   * Insert into array or object node.
   * @param {*} value
   * @param {string|number|null} keyOrIndex
   */
  insert(value, keyOrIndex = null) {
    if (Array.isArray(this.value)) {
      const index = keyOrIndex === null ? this.value.length : keyOrIndex;
      this.value.splice(index, 0, value);
      this.children.splice(index, 0, new JSONNode(value, this, index, this.instanceId));
      // update keyOrIndex of all children after insertion
      for (let i = index + 1; i < this.children.length; i++) {
        this.children[i].keyOrIndex = i;
      }
    } else if (typeof this.value === 'object') {
      if (typeof keyOrIndex !== 'string') {
        throw new Error('Insert into object requires a string key.');
      }
      this.value[keyOrIndex] = value;
      this.children.push(new JSONNode(value, this, keyOrIndex, this.instanceId));
    } else {
      throw new Error('Cannot insert into primitive value.');
    }
  }

  delete() {
    if (!this.parent || this.keyOrIndex == null) return;

    const parentVal = this.parent.value;

    if (Array.isArray(parentVal)) {
      parentVal.splice(this.keyOrIndex, 1);
      this.parent.set(parentVal);
    } else if (typeof parentVal === 'object' && parentVal !== null) {
      delete parentVal[this.keyOrIndex];
      this.parent.set(parentVal);
    } else {
      // Parent is not deletable (primitive etc.)
      throw new Error('Parent is not an object or array — cannot delete child');
    }
  }
}

/**
 * Wrap a raw JSON value as a lensable node tree.
 * @param {*} value
 * @param {*} parent
 * @param {*} keyOrIndex
 * @param {string} instanceId
 * @returns {JSONNode}
 */
export function wrapJson(value, parent = null, keyOrIndex = null, instanceId = 'default') {
  const jsonNode = new JSONNode(value, parent, keyOrIndex, instanceId);
  console.log('wrapJson', jsonNode);
  return jsonNode;
  // return new JSONNode(value, parent, keyOrIndex, instanceId);
}

/**
 * Returns the correct lens for a JSON node based on its parent and key/index.
 * Assumes the node is already in a wrapped structure, or retrievable via parent.
 *
 * @param {any} node - The JSON node (primitive value or structure)
 * @param {JSONNode} parent - The parent JSONNode
 * @param {string|number} keyOrIndex - The key (for objects) or index (for arrays)
 * @returns {JSONNode} A JSONNode wrapping the value with lens and context
 */

/**
 * Returns the correct lens for a JSON node based on its parent and key/index.
 * Assumes the node is already in a wrapped structure, or retrievable via parent.
 *
 * @param {any} node - The JSON node (primitive value or structure)
 * @param {JSONNode} parent - The parent JSONNode
 * @param {string|number} keyOrIndex - The key (for objects) or index (for arrays)
 * @returns {JSONNode} A JSONNode wrapping the value with lens and context
 */
/*
export function getLensForNode(node, parent, keyOrIndex) {
  if (!parent || !parent.__jsonlens__) {
    console.warn('getLensForNode called without proper parent lens');
    return node;
  }

  const lens = parent.__jsonlens__.lens;
  const wrapped = lens.get(parent.value, keyOrIndex);
  return wrapped;
}
*/

/**
 * Attempts to wrap a raw value into a JSONNode, using fallback logic if needed.
 * @param {any} value - The raw value to wrap.
 * @param {JSONNode|null} parent - The parent JSONNode (if known).
 * @param {string|number|null} key - The key/index in the parent (if known).
 * @param {string} instanceId - The ID of the instance.
 * @param {Object} instanceRoot - The full wrapped instance root, to help recover parent/key.
 * @returns {JSONNode|any}
 */
export function getLensForNode(value, parent = null, key = null, instanceId, instanceRoot = null) {
  if (value?.__jsonlens__) return value;

  // Attempt fallback recovery if key or parent missing
  if ((!parent || typeof key === 'undefined') && instanceRoot) {
    const queue = [instanceRoot];
    while (queue.length) {
      const current = queue.shift();
      if (!current?.children) continue;

      for (const child of current.children) {
        if (child.value === value) {
          parent = current;
          key = child.keyOrIndex;
          break;
        } else {
          queue.push(child);
        }
      }
      if (parent) break;
    }

    if (!parent || typeof key === 'undefined') {
      console.warn('[getLensForNode] Unable to determine parent/key for value:', value);
      return value; // Bail out, return raw value
    }
  }

  return new JSONNode(value, parent, key, instanceId);
}
