import { AbstractAction } from './abstract-action.js';
import getInScopeContext from '../getInScopeContext.js';
import {
  evaluateXPathToNodes,
  evaluateXPathToFirstNode,
  evaluateXPathToNumber,
} from '../xpath-evaluation.js';
import { XPathUtil } from '../xpath-util.js';
import { Fore } from '../fore.js';
import { getPath } from '../xpath-path.js';

// JSON support
import { JSONLens } from '../json/JSONLens.js';

/**
 * `fx-insert`
 * inserts nodes into data instances
 *
 * @customElement
 */
export class FxInsert extends AbstractAction {
  static get properties() {
    return {
      ...super.properties,
      at: {
        type: Number,
      },
      position: {
        type: String,
      },
      origin: {
        type: Object,
      },
      keepValues: {
        type: Boolean,
      },
    };
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }
    const style = `
        :host{
            display:none;
        }
    `;
    this.shadowRoot.innerHTML = `
        <style>
            ${style}
        </style>
        <slot></slot>
    `;

    this.at = Number(this.hasAttribute('at') ? this.getAttribute('at') : 0); // default: size of nodeset, determined later
    this.position = this.hasAttribute('position') ? this.getAttribute('position') : 'after';
    this.origin = this.hasAttribute('origin') ? this.getAttribute('origin') : null; // last item of context seq
    this.keepValues = !!this.hasAttribute('keep-values');
  }

  // -------------------------
  // JSON helpers
  // -------------------------
  _getValueAtLensSteps(rootValue, steps) {
    let cur = rootValue;
    for (const step of steps || []) {
      if (cur === null || cur === undefined) return undefined;

      // keyOrIndex can be string (object key) or number (array index)
      if (typeof step === 'number') {
        if (!Array.isArray(cur)) return undefined;
        cur = cur[step];
      } else {
        cur = cur[step];
      }
    }
    return cur;
  }
  _getInlineTemplateElement() {
    // Prefer a direct child <template>, otherwise any descendant <template> within fx-insert
    const direct = Array.from(this.children).find(c => c?.localName === 'template');
    if (direct) return direct;
    return this.querySelector('template');
  }

  _getTemplateElementById(templateId) {
    if (!templateId) return null;

    // Try within the same fore first (shadow + light)
    const fore = this.getOwnerForm?.() || this.closest('fx-fore');
    const sel = `template#${CSS.escape(templateId)}`;

    if (fore) {
      const inLight = fore.querySelector(sel);
      if (inLight) return inLight;
      const inShadow = fore.shadowRoot?.querySelector?.(sel);
      if (inShadow) return inShadow;
    }

    // Global fallback
    const el = document.getElementById(templateId);
    return el && el.localName === 'template' ? el : null;
  }

  _getJsonTemplateTextFromTemplateEl(tplEl) {
    if (!tplEl) return null;

    // Keep it robust against whitespace/formatting
    const raw = String(tplEl.textContent || '').trim();
    if (!raw) return null;
    return raw;
  }

  _tryParseJsonFromTemplateEl(tplEl, errorLabel) {
    const txt = this._getJsonTemplateTextFromTemplateEl(tplEl);
    if (!txt) return null;
    try {
      return JSON.parse(txt);
    } catch (_e) {
      throw new Error(`fx-insert: ${errorLabel} does not contain valid JSON`);
    }
  }
  _isJsonLiteral(value) {
    if (value === null || value === undefined) return false;
    const t = String(value).trim();
    return (t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'));
  }

  _parseJsonLiteral(value) {
    const t = String(value ?? '').trim();
    return JSON.parse(t);
  }

  _matchIndexRepeatId(expr) {
    const t = String(expr ?? '').trim();
    const m = t.match(/^index\s*\(\s*(['"])(.*?)\1\s*\)\s*$/);
    return m ? m[2] : null;
  }

  _resolveRepeatById(repeatId, fore) {
    if (!repeatId || !fore) return null;
    try {
      return fore.querySelector(`#${CSS.escape(repeatId)}`);
    } catch (_e) {
      // CSS.escape not available or invalid selector; fall back
      return fore.querySelector(`#${repeatId}`);
    }
  }
  _isJsonLensRef(ref) {
    if (!ref) return false;
    const t = String(ref).trim();
    return t.startsWith('?') || /^instance\s*\(/.test(t);
  }

  _deepClone(value) {
    // Prefer structuredClone when available
    if (typeof structuredClone === 'function') return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  _clearJsonValues(value) {
    // Produce an “empty” structure with same keys/shape.
    if (Array.isArray(value)) return value.map(v => this._clearJsonValues(v));
    if (value && typeof value === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(value)) {
        out[k] = this._clearJsonValues(v);
      }
      return out;
    }
    // primitives: clear to empty string (inputs render blank)
    return '';
  }

  _jsonNodeToLensSteps(node) {
    // Build JSONLens path array from a JSONNode by walking parents.
    const steps = [];
    let cur = node;
    while (cur && cur.parent !== null && cur.keyOrIndex !== null && cur.keyOrIndex !== undefined) {
      steps.unshift(cur.keyOrIndex);
      cur = cur.parent;
    }
    return steps;
  }

  _resolveRepeatElement() {
    // Don’t use XPathUtil.getClosest here: it can receive non-Elements and then `.matches()` explodes.
    return this && this.nodeType === Node.ELEMENT_NODE && typeof this.closest === 'function'
      ? this.closest('fx-repeat')
      : null;
  }

  _performJsonInsert(inscope, fore) {
    // We need the ARRAY CONTAINER node, not the array children.
    // IMPORTANT: do not rely on xpath-evaluation here because action in-scope context
    // can be a DOM node (trigger/button), not a JSON lens node.
    const target = this._resolveJsonRefToNode(this.ref);
    if (!target || !target.__jsonlens__) {
      throw new Error('fx-insert JSON mode: ref did not resolve to a JSON lens node');
    }

    // Determine array container + insertion index
    let arrayNode = target;
    let insertIndex = 0;

    // If ref points to an array item, insert relative to its parent array
    if (
        !Array.isArray(arrayNode.value) &&
        arrayNode.parent &&
        Array.isArray(arrayNode.parent.value)
    ) {
      const itemNode = arrayNode;
      arrayNode = itemNode.parent;

      const base =
          typeof itemNode.keyOrIndex === 'number' ? itemNode.keyOrIndex : arrayNode.value.length;

      if (this.position === 'before') insertIndex = base;
      else insertIndex = base + 1; // after (default)
    } else {
      // ref points to the array itself
      if (!Array.isArray(arrayNode.value)) {
        throw new Error('fx-insert JSON mode: target is not an array');
      }

      const len = arrayNode.value.length;

      if (this.hasAttribute('at')) {
        // `at` is 1-based like XForms/XPath.
        // When combined with position="after", we insert *after* the item at `at`.
        const atExpr = this.getAttribute('at');

        let at1;
        if (/^\s*-?\d+(?:\.\d+)?\s*$/.test(atExpr)) {
          at1 = Number(atExpr);
        } else {
          at1 = Number(evaluateXPathToNumber(atExpr, inscope, this));
        }
        if (Number.isNaN(at1) || at1 < 1) at1 = 1;

        const base0 = Math.min(len, Math.max(0, at1 - 1));

        if (this.position === 'after') {
          insertIndex = Math.min(len, base0 + 1);
        } else {
          // before (and any other value): insert at the computed base index
          insertIndex = base0;
        }
      } else if (this.position === 'first') {
        insertIndex = 0;
      } else if (this.position === 'last') {
        insertIndex = len; // append
      } else {
        // default behavior: append
        insertIndex = len;
      }
    }

    // ------------------------------------------------------------
    // IMPORTANT: update repeat index even if action is outside repeat
    // ------------------------------------------------------------
    // If at="index('movies')" (like in your demo), ensure index('movies')
    // points at the new row BEFORE subsequent actions run.
    const atExpr = this.getAttribute('at');
    const repeatId = this._matchIndexRepeatId(atExpr);
    const repeatFromAt = repeatId ? this._resolveRepeatById(repeatId, fore) : null;

    // If action *is* inside a repeat, keep existing behavior as fallback
    const repeatLocal = this._resolveRepeatElement();
    const repeat = repeatFromAt || repeatLocal;

    if (repeat) {
      const newIndex1 = insertIndex + 1;
      repeat.setAttribute('index', String(newIndex1));
      if (typeof repeat.setIndex === 'function') {
        try {
          repeat.setIndex(newIndex1);
        } catch (_e) {
          // ignore
        }
      }
    }

    // ----------------------
    // Compute insert value
    // ----------------------
    // Goal:
    // - origin attribute OR <template> (inline or referenced) are AUTHOR-DEFINED defaults -> keep as-is
    // - only the implicit fallback (clone last item) is cleared unless keep-values is set

    let templateValue = null;
    let hasExplicitOriginOrTemplate = false;

    if (this.origin) {
      // origin attribute is always explicit
      hasExplicitOriginOrTemplate = true;

      // 1) JSON literal origin (existing behavior): origin="{ ... }"
      if (this._isJsonLiteral(this.origin)) {
        templateValue = this._parseJsonLiteral(this.origin);
      } else {
        // 2) lens origin: origin="?foo?bar" OR 3) XPath origin
        const originNode = this._isJsonLensRef(this.origin)
          ? this._resolveJsonRefToNode(this.origin)
          : evaluateXPathToFirstNode(this.origin, inscope, this);

        if (originNode && originNode.__jsonlens__) {
          templateValue = this._deepClone(originNode.value);
        } else {
          // origin was present but did not resolve -> keep old behavior: fall back
          templateValue = null;
          hasExplicitOriginOrTemplate = false;
        }
      }
    } else {
      // No origin attribute: allow JSON via template="id" or inline <template>...</template>
      const templateId = this.getAttribute('template');
      if (templateId) {
        const tplEl = this._getTemplateElementById(templateId);
        const parsed = this._tryParseJsonFromTemplateEl(tplEl, `template=\"${templateId}\"`);
        if (parsed !== null) {
          templateValue = parsed;
          hasExplicitOriginOrTemplate = true;
        }
      }

      if (templateValue === null) {
        const inlineTpl = this._getInlineTemplateElement();
        const parsed = this._tryParseJsonFromTemplateEl(inlineTpl, 'inline <template>');
        if (parsed !== null) {
          templateValue = parsed;
          hasExplicitOriginOrTemplate = true;
        }
      }
    }

    if (templateValue === null) {
      // Fallback: clone last item if it exists, else insert empty object
      const len = arrayNode.value.length;
      if (len > 0) {
        templateValue = this._deepClone(arrayNode.value[len - 1]);
      } else {
        templateValue = {};
      }
      hasExplicitOriginOrTemplate = false;
    }

    // Explicit origin/template values must be preserved as-is.
    // Only the implicit fallback clone gets cleared (unless keep-values is set).
    const newValue =
      this.keepValues || hasExplicitOriginOrTemplate
        ? this._deepClone(templateValue)
        : this._clearJsonValues(templateValue);

    // Mutate raw JSON via JSONLens
// Mutate JSON in a way that keeps JSONNode.children in sync
    const instanceId = XPathUtil.resolveInstance(this, this.ref);
    const model = this.getModel();
    const instance = model.getInstance(instanceId);

// 1) BEST: use the JSONNode API if available (it should update children)
    if (arrayNode && typeof arrayNode.insert === 'function') {
      arrayNode.insert(newValue, insertIndex);
    } else {
      // 2) Fallback: mutate raw data via JSONLens
      const steps = this._jsonNodeToLensSteps(arrayNode);
      const lens = new JSONLens(instance.instanceData, steps);
      lens.insert(newValue, insertIndex);

      // Force the array node to notice the change and rebuild children:
      // IMPORTANT: change reference so set() can't short-circuit on sameRef=true
      const nextArr = Array.isArray(arrayNode.value) ? arrayNode.value.slice() : [];
      if (typeof arrayNode.set === 'function') {
        arrayNode.set(nextArr);
      } else {
        // last resort
        arrayNode.value = nextArr;
        if (typeof arrayNode._buildChildren === 'function') arrayNode._buildChildren();
      }
    }

// At this point, children MUST match value length
    if (Array.isArray(arrayNode.value) && Array.isArray(arrayNode.children)) {
      if (arrayNode.children.length !== arrayNode.value.length) {
        // One more forced rebuild to be safe
        const nextArr = arrayNode.value.slice();
        if (typeof arrayNode.set === 'function') arrayNode.set(nextArr);
        else if (typeof arrayNode._buildChildren === 'function') arrayNode._buildChildren();
      }
    }

    const insertedNode = arrayNode.children?.[insertIndex] || null;

    // Dispatch Fore insert event similarly to XML branch
    const xpath = insertedNode?.getPath ? insertedNode.getPath() : '';

    Fore.dispatch(instance, 'insert', {
      insertedNodes: insertedNode,
      insertedParent: arrayNode,
      ref: this.ref,
      location: insertedNode,
      position: this.position,
      instanceId,
      foreId: fore.id,
      index: insertIndex + 1,
      xpath,
    });

    document.dispatchEvent(
        new CustomEvent('index-changed', {
          composed: true,
          bubbles: true,
          detail: {
            insertedNodes: insertedNode,
            index: insertIndex + 1,
          },
        }),
    );

    // Ensure UI updates
    this.needsUpdate = true;
    return [xpath];
  }
  // -------------------------
  // Existing XML clone helpers
  // -------------------------

  _cloneOriginSequence(inscope, targetSequence) {
    let originSequenceClone;
    if (this.origin) {
      // ### if there's an origin attribute use it
      let originTarget;
      try {
        if (this.origin.startsWith('#') && this.getOwnerForm().createNodes) {
          const repeat = this.getOwnerForm().querySelector(this.origin);
          originSequenceClone = repeat.createdNodeset.cloneNode(true);
          if (!originSequenceClone) {
            console.error(`createdNodeset for repeat ${this.origin} does not exist`);
          }
        } else {
          originTarget = evaluateXPathToFirstNode(this.origin, inscope, this);
          if (Array.isArray(originTarget) && originTarget.length === 0) {
            console.warn('invalid origin for this insert action - ignoring...', this);
            originSequenceClone = null;
          }
          originSequenceClone = originTarget.cloneNode(true);
        }
      } catch (error) {
        console.warn('invalid origin for this insert action - ignoring...', this);
      }
    } else if (targetSequence) {
      // ### use last item of targetSequence
      originSequenceClone = this._cloneTargetSequence(targetSequence);
      if (originSequenceClone && !this.keepValues) {
        this._clear(originSequenceClone);
      }
    }
    return originSequenceClone;
  }

  _getInsertIndex(inscope, targetSequence) {
    if (targetSequence.length === 0) {
      return null;
    }
    if (this.hasAttribute('at')) {
      return evaluateXPathToNumber(this.getAttribute('at'), inscope, this);
    }
    return targetSequence.length;
  }

  _parseJsonLensRef(ref, defaultInstanceId = 'default') {
    if (!ref) return null;
    const s = String(ref).trim();

    // instance('id')?a?b
    const instMatch = s.match(/^instance\s*\(\s*(['"])(.*?)\1\s*\)\s*(\?.*)?$/);
    let instanceId;
    let lensPart;

    if (instMatch) {
      instanceId = instMatch[2];
      lensPart = instMatch[3] || '';
    } else {
      if (!s.startsWith('?')) return null;
      instanceId = defaultInstanceId;
      lensPart = s;
    }

    const steps = lensPart
      .split('?')
      .filter(Boolean)
      .map(part => {
        if (part === '*') return '*';
        if (/^\d+$/.test(part)) return Number(part) - 1; // 1-based -> 0-based
        return part;
      });

    return { instanceId, steps };
  }

  _resolveJsonRefToNode(ref) {
    const parsed = this._parseJsonLensRef(ref, 'default');
    if (!parsed) return null;

    const model = this.getModel();
    const instance = model?.getInstance?.(parsed.instanceId) || model?.getInstance?.('default');
    const root = instance?.nodeset;
    if (!root || !root.__jsonlens__) return null;

    let node = root;
    for (const step of parsed.steps) {
      if (step === '*') {
        // For insert we require a concrete container; callers should not use wildcard here.
        return null;
      }
      node = node?.get?.(step);
      if (!node) return null;
    }
    return node;
  }

  async perform() {
    let inscope;
    let context;
    let targetSequence = [];

    const fore = this.getOwnerForm();
    const inscopeContext = getInScopeContext(this);

    // -----------------------------------------
    // Decide mode ONLY by instance type (NOT ref)
    // -----------------------------------------
    const exprForInstanceResolution =
      (this.hasAttribute('ref') && this.ref) ||
      (this.hasAttribute('context') && this.getAttribute('context')) ||
      "instance('default')";

    const instanceId = XPathUtil.resolveInstance(this, exprForInstanceResolution);
    const inst = this.getModel()?.getInstance?.(instanceId);

    const isJsonInstance =
      !!inst &&
      (inst.type === 'json' ||
        (typeof inst.getAttribute === 'function' && inst.getAttribute('type') === 'json'));

    if (isJsonInstance) {
      // In JSON mode we only support lens refs that start with '?'
      if (this.hasAttribute('ref') && !this._isJsonLensRef(this.ref)) {
        throw new Error(
          `fx-insert JSON mode: ref must be a JSON lens path starting with '?' (got: ${this.ref})`,
        );
      }
      // For JSON inserts your implementation expects to work from the in-scope lens context
      inscope = inscopeContext;
      return this._performJsonInsert(inscope, fore);
    }

    // -------------------------
    // XML branch (normal XPath)
    // -------------------------

    // context takes precedence over ref
    if (this.hasAttribute('context')) {
      [context] = evaluateXPathToNodes(this.getAttribute('context'), inscopeContext, this);
      inscope = inscopeContext;
    }

    if (this.hasAttribute('ref')) {
      if (inscope) {
        targetSequence = evaluateXPathToNodes(this.ref, inscope, this);
      } else {
        inscope = getInScopeContext(this.getAttributeNode('ref'), this.ref);
        targetSequence = evaluateXPathToNodes(this.ref, inscope, this);
      }
    }

    const originSequenceClone = this._cloneOriginSequence(inscope, targetSequence);
    if (!originSequenceClone) return;

    let insertLocationNode;
    let index;

    if (targetSequence.length === 0) {
      if (context) {
        insertLocationNode = context;
        context.appendChild(originSequenceClone);
        fore.signalChangeToElement(insertLocationNode.localName);
        fore.signalChangeToElement(originSequenceClone.localName);
        index = 1;
      } else if (!inscope && this.getOwnerForm().createNodes) {
        const repeat = this.getOwnerForm().querySelector(this.origin);
        inscope = getInScopeContext(repeat, repeat.ref);
        insertLocationNode = inscope;
        inscope.appendChild(originSequenceClone);
        index = inscope.length - 1;
      } else {
        insertLocationNode = inscope;
        inscope.appendChild(originSequenceClone);
        index = 1;
      }
    } else {
      if (this.hasAttribute('at')) {
        index = evaluateXPathToNumber(this.getAttribute('at'), inscope, this);
        insertLocationNode = targetSequence[index - 1]; // 1-based
      } else {
        index = targetSequence.length;
        insertLocationNode = targetSequence[targetSequence.length - 1];
      }

      if (!insertLocationNode) {
        index = 1;
        insertLocationNode = targetSequence;
        const ctxIndex = evaluateXPathToNumber(
          'count(preceding::*)',
          targetSequence,
          this.getOwnerForm(),
        );
        index = ctxIndex + 1;
      }

      if (this.position && this.position === 'before') {
        insertLocationNode.parentNode.insertBefore(originSequenceClone, insertLocationNode);
        fore.signalChangeToElement(insertLocationNode.parentNode);
        fore.signalChangeToElement(originSequenceClone.localName);
      }

      if (this.position && this.position === 'after') {
        index += 1;
        if (this.hasAttribute('context') && this.hasAttribute('ref')) {
          inscope.append(originSequenceClone);
          fore.signalChangeToElement(insertLocationNode);
          fore.signalChangeToElement(originSequenceClone.localName);
        } else if (this.hasAttribute('context')) {
          index = 1;
          insertLocationNode.prepend(originSequenceClone);
          fore.signalChangeToElement(insertLocationNode);
          fore.signalChangeToElement(originSequenceClone.localName);
        } else {
          insertLocationNode.insertAdjacentElement('afterend', originSequenceClone);
          fore.signalChangeToElement(insertLocationNode);
          fore.signalChangeToElement(originSequenceClone.localName);
        }
      }
    }

    const xpath = getPath(insertLocationNode, instanceId);

    const path = Fore.getDomNodeIndexString(originSequenceClone);
    this.dispatchEvent(
      new CustomEvent('execute-action', {
        composed: true,
        bubbles: true,
        cancelable: true,
        detail: { action: this, event: this.event, path },
      }),
    );

    Fore.dispatch(inst, 'insert', {
      insertedNodes: originSequenceClone,
      insertedParent: insertLocationNode.parentNode,
      ref: this.ref,
      location: insertLocationNode,
      position: this.position,
      instanceId,
      foreId: fore.id,
      index,
      xpath,
    });

    document.dispatchEvent(
      new CustomEvent('index-changed', {
        composed: true,
        bubbles: true,
        detail: {
          insertedNodes: originSequenceClone,
          index,
        },
      }),
    );

    this.needsUpdate = true;
    return [xpath];
  }

  // eslint-disable-next-line class-methods-use-this
  _cloneTargetSequence(seq) {
    if (Array.isArray(seq) && seq.length !== 0) {
      return seq[seq.length - 1].cloneNode(true);
    }
    if (!Array.isArray(seq) && seq) {
      return seq.cloneNode(true);
    }
    return null;
  }

  actionPerformed(changedPaths) {
    super.actionPerformed();
  }

  /**
   * clear all text nodes and attribute values to get a 'clean' template.
   * @param n
   * @private
   */
  _clear(n) {
    const attrs = n.attributes;

    // clear attrs
    for (let i = 0; i < attrs.length; i += 1) {
      attrs[i].value = '';
    }
    // clear text content
    if (n.textContent) {
      n.textContent = '';
    }

    let node = n.firstChild;
    while (node) {
      if (node.nodeType === 1 && node.hasAttributes()) {
        node.textContent = '';
      }
      this._clear(node);
      node = node.nextSibling;
    }
  }
}

if (!customElements.get('fx-insert')) {
  window.customElements.define('fx-insert', FxInsert);
}
