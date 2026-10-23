import { AbstractAction } from './abstract-action.js';
import getInScopeContext from '../getInScopeContext.js';
import {
  evaluateXPathToNodes,
  evaluateXPathToFirstNode,
  evaluateXPathToNumber,
  evaluateXPathToString,
} from '../xpath-evaluation.js';
import { XPathUtil } from '../xpath-util';
import { Fore } from '../fore.js';

/**
 * `fx-insertchild`
 * inserts nodes into data instances, either by cloning an `origin` / `template` (a wrapper around `fx-insert`),
 * or - with `child` and no `origin` - by creating a new, empty element named `child` inside `parent`.
 *
 * `child` is a literal element name or contains `{...}` XPath templates (e.g. `child="{@name}"` inside a repeat).
 * The new element takes its namespace from `parent`, so it fits into XHTML and namespace-less documents alike.
 * `position` is `first` or `last` (default) there: the new element becomes the first or last child of `parent`.
 *
 *                         <fx-insertchild parent="instance('doc')/section" child="note" position="first"></fx-insertchild>
 *
 * Cloning variant:
 *                         <fx-insertChild parent="instance('i-stopwatches')/stopwatches"
 *                                         child="watch"
 *                                         template="instance('vars')/templates/watch"
 *                                         at="1"
 *                                         position="before"></fx-insertChild>
 * @customElement
 */
export class FxInsertchild extends AbstractAction {
  static get properties() {
    return {
      ...super.properties,
      at: {
        type: Number,
      },
      child: {
        type: String,
      },
      parent: {
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
    this.at = Number(this.hasAttribute('at') ? this.getAttribute('at') : 1); // default: size of nodeset, determined later
    this.child = this.getAttribute('child');
    this.parent = this.getAttribute('parent');
    this.position = this.hasAttribute('position') ? this.getAttribute('position') : 'after';
    this.origin = this.hasAttribute('origin') ? this.getAttribute('origin') : null; // last item of context seq
    this.keepValues = !!this.hasAttribute('keep-values');

    const style = `
        :host{
            display:none;
        }
    `;
    this.shadowRoot.innerHTML = `
        <style>
            ${style}
        </style>
        <fx-insert context="${this.parent}"
                   ref="${this.ref}"
                   origin="${this.origin}"
                   at="${this.at}"
                   position="${this.position}"></fx-insert>
                   
    `;
  }

  async perform() {
    super.perform();
    if (this.child && !this.origin) {
      await this._createChild();
      return;
    }
    const insert = this.shadowRoot.querySelector('fx-insert');
    await insert.perform();
    this.needsUpdate = true;
  }

  /** Creates the empty element `child` inside `parent`. */
  async _createChild() {
    const inscope = getInScopeContext(this, this.parent);
    const parentNode = evaluateXPathToFirstNode(this.parent, inscope, this);
    if (!parentNode || parentNode.nodeType !== Node.ELEMENT_NODE) {
      await Fore.dispatch(this, 'error', {
        message: `fx-insertchild: parent '${this.parent}' does not select an element`,
      });
      return;
    }

    // An HTMLTemplateElement keeps its children in .content, which XPath cannot address, and XML serialization
    // writes only .content - a child appended to the element itself would be lost on save.
    if (typeof HTMLTemplateElement !== 'undefined' && parentNode instanceof HTMLTemplateElement) {
      await Fore.dispatch(this, 'error', {
        message:
          "fx-insertchild: cannot insert into a <template> element; its content is not addressable by XPath",
      });
      return;
    }

    const name = this.child
      .replace(/\{([^}]*)\}/g, (_, expr) => evaluateXPathToString(expr, inscope, this))
      .trim();
    if (!/^[A-Za-z_][\w.-]*$/.test(name)) {
      await Fore.dispatch(this, 'error', {
        message: `fx-insertchild: '${name}' is not a valid element name`,
      });
      return;
    }

    const element = parentNode.ownerDocument.createElementNS(parentNode.namespaceURI, name);
    if (this.position === 'first') {
      parentNode.prepend(element);
    } else {
      parentNode.append(element);
    }

    const fore = this.getOwnerForm();
    fore.signalChangeToElement(parentNode.localName);
    fore.signalChangeToElement(element.localName);
    this.needsUpdate = true;
  }
}

if (!customElements.get('fx-insertChild')) {
  window.customElements.define('fx-insertchild', FxInsertchild);
}
