// import { FxAction } from './fx-action.js';
import '../fx-model.js';
import { AbstractAction } from './abstract-action.js';
import { evaluateXPath, evaluateXPathToString } from '../xpath-evaluation.js';
import { Fore } from '../fore.js';
import getInScopeContext from '../getInScopeContext';
import { FxBind } from '../fx-bind';

/**
 * `fx-setattribute` allows to create and set an attribute value in the data.
 *
 * `value` is an XPath expression. `name` is a literal attribute name, or may contain `{...}` XPath
 * templates (like attribute value templates) to compute it, e.g. `name="{@name}"` inside a repeat.
 *
 * @customElement
 */
export default class FxSetattribute extends AbstractAction {
  static get properties() {
    return {
      ...super.properties,
      ref: {
        type: String,
      },
      attrName: {
        type: String,
      },
      attrValue: {
        type: String,
      },
    };
  }

  constructor() {
    super();
    this.ref = '';
    this.attrName = '';
    this.attrValue = '';
  }

  connectedCallback() {
    if (super.connectedCallback) {
      super.connectedCallback();
    }

    if (this.hasAttribute('ref')) {
      this.ref = this.getAttribute('ref');
    } else {
      throw new Error('fx-setvalue must specify a "ref" attribute');
    }
    this.attrName = this.hasAttribute('name') ? this.getAttribute('name') : null;
    this.attrValue = this.hasAttribute('value') ? this.getAttribute('value') : '';
    if (!this.attrName) {
      Fore.dispatch(this, 'error', { message: 'name or value not specified' });
    }
  }

  async perform() {
    super.perform();
    const mi = this.getModelItem();
    if (mi.node.nodeType !== Node.ELEMENT_NODE) {
      await Fore.dispatch(this, 'error', { message: 'referenced item is not an element' });
      return;
    }
    // `value` is an XPath expression, like on fx-setvalue (quote literals: value="'true'")
    let value = '';
    if (this.attrValue !== '') {
      const inscopeContext = getInScopeContext(this, this.attrValue);
      const [result] = evaluateXPath(this.attrValue, inscopeContext, this, this.detail);
      if (result?.nodeType === Node.ATTRIBUTE_NODE) {
        value = result.nodeValue;
      } else if (result?.nodeType) {
        value = result.textContent;
      } else if (result !== undefined && result !== null) {
        value = String(result);
      }
    }
    const attrName = this._resolveName();
    if (!attrName) {
      await Fore.dispatch(this, 'error', { message: 'name evaluated to an empty string' });
      return;
    }
    mi.node.setAttribute(attrName, value);
    const newModelItem = FxBind.createModelItem(
      `${this.ref}/@${attrName}`,
      mi.node.getAttributeNode(attrName),
      this,
      null,
    );
    // IMPORTANT: registerModelItem may return an existing canonical ModelItem for the same path.
    // Always use the returned instance for notifications.
    const canonical = this.getOwnerForm().getModel().registerModelItem(newModelItem);
    this.getOwnerForm().addToBatchedNotifications(canonical);
    this.needsUpdate = true;
    canonical.notify();
    // On first-time attribute creation the ModelItem has no observers yet (no ref
    // could have read a nonexistent attribute), so notify() alone reaches nobody.
    // Signal a structural change so refs matching the owner element re-evaluate.
    this.getOwnerForm().signalChangeToElement(mi.node.localName);
  }

  /** The attribute name: `name` as written, with every `{expr}` replaced by its string value. */
  _resolveName() {
    if (!this.attrName.includes('{')) return this.attrName;
    const inscopeContext = getInScopeContext(this, this.attrName);
    return this.attrName
      .replace(/\{([^}]*)\}/g, (_, expr) => evaluateXPathToString(expr, inscopeContext, this))
      .trim();
  }
}

if (!customElements.get('fx-setattribute')) {
  window.customElements.define('fx-setattribute', FxSetattribute);
}
