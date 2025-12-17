// json-lens.js
import { JSONNode } from './JSONNode.js';

export function wrapJson(value, parent = null, keyOrIndex = null, instanceId = 'default') {
  return new JSONNode(value, parent, keyOrIndex, instanceId);
}

export class JSONLens {
  constructor(root, path = []) {
    this.root = root; // the raw JSON object
    this.path = path; // path to target node, e.g., ['invoice', 'items', 0]
  }

  _resolveParent() {
    const lastKey = this.path[this.path.length - 1];
    const parentPath = this.path.slice(0, -1);
    const parent = parentPath.reduce((obj, key) => obj?.[key], this.root);
    return [parent, lastKey];
  }

  get() {
    return this.path.reduce((obj, key) => obj?.[key], this.root);
  }

  set(value) {
    const [parent, key] = this._resolveParent();
    if (parent !== undefined) {
      parent[key] = value;
    }
  }

  delete() {
    const [parent, key] = this._resolveParent();
    if (Array.isArray(parent)) {
      parent.splice(key, 1);
    } else if (parent && typeof parent === 'object') {
      delete parent[key];
    }
  }

  insert(value, keyOrIndex = null) {
    const target = this.get();

    if (Array.isArray(target)) {
      if (keyOrIndex === null || keyOrIndex >= target.length) {
        target.push(value); // append
      } else {
        target.splice(keyOrIndex, 0, value); // insert at index
      }
    } else if (target && typeof target === 'object') {
      if (typeof keyOrIndex !== 'string') {
        throw new Error('Inserting into an object requires a string key.');
      }
      target[keyOrIndex] = value;
    } else {
      throw new Error('Target is not insertable (must be object or array).');
    }
  }

  lensForChild(key) {
    return new JSONLens(this.root, this.path.concat(key));
  }

  pathString() {
    return '/' + this.path.map(k => (typeof k === 'number' ? `[${k}]` : k)).join('/');
  }
}
